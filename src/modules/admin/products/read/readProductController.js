// src/modules/products/read/readProductController.js
import productService from '../../../services/productService.js';

export default async function readProductController(container) {
  // container es el elemento donde se inyectará la vista (lo pasa el router)
  try {
    const products = await productService.getAllProducts();
    
    let html = `
      <div class="card">
        <div class="card-header">
          <h2>Productos</h2>
          <button id="newProductBtn" class="btn btn-primary">+ Nuevo producto</button>
        </div>
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    if (products.length === 0) {
      html += `<tr><td colspan="5">No hay productos registrados</td></tr>`;
    } else {
      products.forEach(product => {
        html += `
          <tr>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.category}</td>
            <td>
              <button class="btn btn-sm btn-info" data-id="${product.id}" data-action="view">Ver</button>
              <button class="btn btn-sm btn-warning" data-id="${product.id}" data-action="edit">Editar</button>
              <button class="btn btn-sm btn-danger" data-id="${product.id}" data-action="delete">Eliminar</button>
            </td>
          </tr>
        `;
      });
    }
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Eventos después de inyectar
    document.getElementById('newProductBtn')?.addEventListener('click', () => {
      window.router.navigate('/products/create');
    });
    
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        window.router.navigate(`/products/read/${id}`);
      });
    });
    
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        window.router.navigate(`/products/update/${id}`);
      });
    });
    
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm('¿Eliminar este producto?')) {
          await productService.deleteProduct(id);
          window.router.navigate('/products/read');
        }
      });
    });
    
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}