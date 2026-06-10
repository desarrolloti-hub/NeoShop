// src/modules/products/create/createProductController.js
import productService from '../../../services/productService.js';

export default async function createProductController(container) {
  const html = `
    <div class="card">
      <div class="card-header">
        <h2>Crear Producto</h2>
      </div>
      <div class="card-body">
        <form id="productForm">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="name" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input type="number" id="price" step="0.01" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Stock</label>
            <input type="number" id="stock" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <input type="text" id="category" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea id="description" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>URL de imagen</label>
            <input type="url" id="imageUrl" class="form-control">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Guardar</button>
            <button type="button" id="cancelBtn" class="btn btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  const form = document.getElementById('productForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
      name: document.getElementById('name').value,
      price: parseFloat(document.getElementById('price').value),
      stock: parseInt(document.getElementById('stock').value),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value,
      imageUrl: document.getElementById('imageUrl').value
    };
    
    try {
      await productService.createProduct(productData);
      alert('Producto creado exitosamente');
      window.router.navigate('/products/read');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
  
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.router.navigate('/products/read');
  });
}