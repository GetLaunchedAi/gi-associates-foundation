//
//    Toggle Mobile Navigation
//
const navbarMenu = document.querySelector("#navigation #navbar-menu");
const hamburgerMenu = document.querySelector("#navigation .hamburger-menu");
const serviceMenu = document.querySelector("#Services");
const supportMenu = document.querySelector("#Support");
const about = document.querySelector('#About\\ Us')
const contact = document.querySelector('#Contact')
const support = document.querySelector('#Support')
const shop = document.querySelector('#Shop')



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

// Function to handle dropdown toggle
function handleDropdownToggle(clickedDropdown) {
    const isOpen = clickedDropdown.classList.contains("open");
    
    // Close all other dropdowns first
    const allDropdowns = [serviceMenu, supportMenu];
    allDropdowns.forEach(dropdown => {
        if (dropdown && dropdown !== clickedDropdown) {
            dropdown.setAttribute("aria-expanded", false);
            dropdown.classList.remove("open");
        }
    });
    
    if (!isOpen) {
        clickedDropdown.setAttribute("aria-expanded", true);
        clickedDropdown.classList.add("open");
        if (screenWidth < 770) {
            if (clickedDropdown === serviceMenu) {
                // Services dropdown: hide About, Contact, and Support
                if (about) about.style.display = 'none';
                if (contact) contact.style.display = 'none';
                if (support) support.style.display = 'none';
            } else if (clickedDropdown === supportMenu) {
                // Support dropdown: only hide Contact
                if (contact) contact.style.display = 'none';
            }
        }
    } else {
        clickedDropdown.setAttribute("aria-expanded", false);
        clickedDropdown.classList.remove("open");
        if (screenWidth < 770) {
            if (clickedDropdown === serviceMenu) {
                // Services dropdown: show About, Contact, and Support
                if (about) about.style.display = 'block';
                if (contact) contact.style.display = 'block';
                if (support) support.style.display = 'block';
                if (shop) shop.style.display = 'block';
            } else if (clickedDropdown === supportMenu) {
                // Support dropdown: only show Contact
                if (contact) contact.style.display = 'block';
            }
        }
    }
}

// Add event listeners to both dropdowns
if (serviceMenu) {
    serviceMenu.addEventListener('click', function () {
        handleDropdownToggle(serviceMenu);
    });
}

if (supportMenu) {
    supportMenu.addEventListener('click', function () {
        handleDropdownToggle(supportMenu);
    });
}