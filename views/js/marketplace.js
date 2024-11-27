document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productItems = document.querySelectorAll('.product-item');
    const sellItemBtn = document.getElementById('sellItemBtn');
    const sellModal = document.getElementById('sellModal');
    const closeBtn = document.querySelector('.close');
    const sellForm = document.getElementById('sellForm');

    // Product filtering
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            productItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-type') === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Modal functionality
    sellItemBtn.onclick = () => {
        sellModal.style.display = "block";
    }

    closeBtn.onclick = () => {
        sellModal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == sellModal) {
            sellModal.style.display = "none";
        }
    }

    // Form submission
    sellForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Item listed successfully!');
        sellModal.style.display = "none";
        sellForm.reset();
    });

    // Buy button functionality
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.parentElement.querySelector('h3').textContent;
            alert(`Thank you for purchasing ${productName}!`);
        });
    });
});