
See ./install-all.md for notes on installing to a real server.

For local development do the following

install vagrant, eg on debian

	sudo apt install vagrant
	sudo apt install virtualbox
	vagrant plugin install vagrant-vbguest

install dnsmasq for dportal.box name resolution

	host-install-dnsmasq

make sure we dont pollute node_modules into the vagrant box

	rm -rf ../node_modules

bring vagrant up which should setup everything you need in the box

	vagrant up

after that finishes you will be able to visit

	http://dportal.box/

