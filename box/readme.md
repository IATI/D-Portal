
install vagrant

	sudo apt install vagrant
	sudo apt install virtualbox
	vagrant plugin install vagrant-vbguest

install dnsmasq for dportal.box name resolution

	host-install-dnsmasq


bring vagrant up which should setup everything you need in the box

	vagrant up


after that finishes you will be able to visit

	http://dportal.box/


