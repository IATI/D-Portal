When setting up a real server its safer to run things by hand and check 
that nothing went wrong as we go along.

Some of the install scripts can still be used but this list of actions 
should be used rather than just expecting install-all.sh to work.

I cut and paste from this file to the console one line at a time 
watching for problems.

Obviously step one is update apt and make sure a few tools are 
installed. Root commands are prefixed with sudo which should work if we 
are already root or if we are just a user who can sudo.

	sudo apt update
	sudo apt upgrade
	sudo apt install -y build-essential byobu pv curl parallel nano zip unzip git
	byobu-enable
	sudo echo "dportal" >/etc/hostname
	sudo timedatectl set-timezone "Etc/UTC"
	sudo reboot

The reboot to install new kernel (probably) and change hostname. When 
we log back in we should be running byobu and have a UTC timezone.

Add a ctrack user that can sudo without a password but can not login, 
from this point on we can su - ctrack to switch from root to our new 
ctrack user.

	sudo useradd -m -s /usr/bin/bash ctrack
 	sudo usermod -a -G ctrack www-data
	echo "ctrack ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ctrack
	sudo su - ctrack

From now on we are expected to be the ctrack user.

Create some ssh keys.

	ssh-keygen -q -N "" </dev/zero
	cat ~/.ssh/id_rsa.pub

Will need to paste that generated key into github so we can talk ssh to 
them. https://github.com/settings/ssh/new

Set some git global defaults and checkout dportal from git.

	git config --global core.editor nano
	git config --global user.name kriss
	git config --global user.email kriss@xixs.com
	git config --global pull.rebase false
	git clone git@github.com:IATI/D-Portal.git dportal
	cd dportal

Create a /dportal that links to this dportal directory.

	sudo ln -s `readlink -f .` /dportal

Setup local options.

	cp box/env.sh box/env.local.sh
	nano box/env.local.sh

Edit this file so it only contains the exports at the top and tweak 
values as required. IE change PGUSER to ctrack set a random password in 
PGPASS and delete all the bash commands below the exports. 
GITCRON="PUSH" should only be set on one box at a time, it tells the 
scripts to git push updates, so leave this commented out until the old 
box is turned off.

Add these env values to our bash login so we can use them from the 
console. Then logout and log back in so it is applied.

	echo "source ~/dportal/box/env.sh" >>~/.bashrc
	exit
	su - ctrack
	cd dportal

Now we can use the install scripts. Keep a close eye on these to make 
sure they actually work.

	box/install-node.sh
	# and to get  node live on your current bash
	source nvm-install
	
	box/install-postgres.sh
	box/install-nginx.sh
	box/install-dportal.sh

Finally we can import some data into dportal.

	cd ~
	git clone git@github.com:xriss/dataiati.git
	cd dataiati
	./datasets.sh
	mkdir -p /dportal/dstore/cache
	cp datasets/*.xml /dportal/dstore/cache/
	cd /dportal
	box/cron-swap-import

And in another screen ( press F2 and "su - ctrack" to login ) to watch 
the import progress.

	tail -f /dportal/logs/cron.import.log
	
This will take some time. At this point we are up and running the only 
thing left is to add some cronjobs to run things nightly. Make sure old 
dportal is not running these as they will both try and update the same 
git repos and probably clash.

	crontab -e

And add the following line.

	10 0 * * * /bin/bash -c "/dportal/box/cron"

and enable GITCRON in box/env.local.sh so we push cron updates to git.

Make sure we are logged into npm, as freechange tries to publish itself 
once a week via the cron jobs. So we need to run npm login and answer 
its riddles.

	npm login

Make sure certbot is installed and setup as cron will call it to renew.

	sudo apt install -y certbot python3-certbot-nginx

We can just copy /etc/letsencrypt/* from old server 

	# create tar on old box
	cd ~
	sudo tar -czvf letsencrypt.tar.gz /etc/letsencrypt

	# copy it over using scp eg something like
	scp oldbox:letsencrypt.tar.gz .
	scp letsencrypt.tar.gz newbox:.
	
	# extract it on new box
	cd /
	sudo tar -xvf /root/letsencrypt.tar.gz

Finally we may need to edit the nginx settings. The ssl related lines 
at the end of the config will need to be uncommented to enable ssl. 
Then restart nginx.

	sudo nano /etc/nginx/sites-enabled/default
	sudo /etc/init.d/nginx stop
	sudo /etc/init.d/nginx start

Then we wait for the night and see what happens next...


#dpreview

if setting up a d-preview then probably want to make sure these are set 
in env.local.sh so that uploads etc are enabled

	export DSTORE_STATICDIR="/home/ubuntu/portald/docs"
	export DSTORE_HOMEPAGE="/upload"
	export DSTORE_UPLOAD="1"

Also will need to use nginx-preview rather than nginx-default as the 
nginx default config.
