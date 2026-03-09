// admin.js
const productForm = document.getElementById('product-form');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get data from form fields
    const productData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        description: document.getElementById('desc').value
    };

    const token = localStorage.getItem('token'); // Get token from login

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': `Bearer ${token}` // Assuming your middleware looks for this
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert('Product added successfully!');
            productForm.reset();
        } else {
            alert('Failed to add product. Are you logged in as admin?');
        }
    } catch (err) {
        console.error("Error adding product:", err);
    }
});
