// src/modules/products/update/updateProductController.js
import productService from '../../../services/productService.js';

export default async function updateProductController(container, params) {
  const productId = params.id; // el router pasa los parámetros de la ruta
  try {
    const product = await productService.getProductById(productId);
    
    const html = `
      <div class="card">
        <div class="card-header">
          <h2>Editar Producto</h2>
        </div>
        <div class="card-body">
          <form id="productForm">
            <input type="hidden" id="id" value="${product.id}">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" id="name" class="form-control" value="${product.name}" required>
            </div>
            <div class="form-group">
              <label>Precio</label>
              <input type="number" id="price" step="0.01" class="form-control" value="${product.price}" required>
            </div>
            <div class="form-group">
              <label>Stock</label>
              <input type="number" id="stock" class="form-control" value="${product.stock}" required>
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <input type="text" id="category" class="form-control" value="${product.category}" required>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea id="description" class="form-control" rows="3">${product.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>URL de imagen</label>
              <input type="url" id="imageUrl" class="form-control" value="${product.imageUrl || ''}">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Actualizar</button>
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
      const updatedData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        imageUrl: document.getElementById('imageUrl').value
      };
      try {
        await productService.updateProduct(productId, updatedData);
        alert('Producto actualizado');
        window.router.navigate('/products/read');
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.router.navigate('/products/read');
    });
    
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Producto no encontrado</div>`;
  }
}