// ---------- MODALES REGISTER----------
const profileImage = document.getElementById('profileImage');
const avatarPreview = document.getElementById('avatarPreview');
const avatarIcon = document.getElementById('avatarIcon');
const removeBtn = document.getElementById('removeImageBtn');

// Cargar imagen seleccionada
profileImage.addEventListener('change', () => {
    const file = profileImage.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.style.display = 'block';
        avatarIcon.style.display = 'none';
        removeBtn.style.display = 'inline-block';
    };

    reader.readAsDataURL(file);
});

// Eliminar imagen
removeBtn.addEventListener('click', () => {
    profileImage.value = '';
    avatarPreview.src = '';
    avatarPreview.style.display = 'none';
    avatarIcon.style.display = 'block';
    removeBtn.style.display = 'none';
});

// Envío del formulario (demo)
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('✅ Cuenta creada exitosamente (demo)');
});
