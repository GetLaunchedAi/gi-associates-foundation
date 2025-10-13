//
//    Toggle Mobile Navigation
//
const navbarMenu = document.querySelector("#navigation #navbar-menu");
const hamburgerMenu = document.querySelector("#navigation .hamburger-menu");
const serviceMenu = document.querySelector("#navigation .dropdown");
const about = document.querySelector('#About\\ Us')
const contact = document.querySelector('#Contact')
const donations = document.querySelector('#Donations')


let screenWidth = window.innerWidth;

// Update screen width on resize
window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
});

hamburgerMenu.addEventListener('click', function () {
    const isNavOpen = navbarMenu.classList.contains("open");
    if (!isNavOpen) {
        hamburgerMenu.setAttribute("aria-expanded", true);
        hamburgerMenu.classList.add("clicked");
        navbarMenu.classList.add("open");
    } else {
        hamburgerMenu.setAttribute("aria-expanded", false);
        hamburgerMenu.classList.remove("clicked");
        navbarMenu.classList.remove("open");
    }
});

serviceMenu.addEventListener('click', function () {
    const isServiceOpen = serviceMenu.classList.contains("open");
    if (!isServiceOpen) {
        serviceMenu.setAttribute("aria-expanded", true);
        serviceMenu.classList.add("open");
        if (screenWidth < 770) {
            if (about) about.style.display = 'none';
            if (contact) contact.style.display = 'none';
            if (donations) donations.style.display = 'none';
        }
    } else {
        serviceMenu.setAttribute("aria-expanded", false);
        serviceMenu.classList.remove("open");
        if (screenWidth < 770) {
            if (about) about.style.display = 'block';
            if (contact) contact.style.display = 'block';
            if (donations) donations.style.display = 'block';
        }
    }
});