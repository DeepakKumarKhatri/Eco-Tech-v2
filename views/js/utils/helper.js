document.addEventListener("DOMContentLoaded", function () {
    const avatar = document.getElementById("userAvatar");
    const dropdown = document.getElementById("userDropdown");

    avatar.addEventListener("click", function () {
        dropdown.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
        if (!avatar.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    });
});

export default function LoadComponent(file, elementId) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading component:', error));
}