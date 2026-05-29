/* ========================================
   ROUTES - Definición de rutas
   ======================================== */

// Importar controllers de vistas


export const routes = {
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: null
    },
    "/planes": {
        view: "/modules/visitor/plans/plans.html",
        controller: null
    },
    "/ss": {
        view: "/src/views/services.html",
        controller: null
    },
    "/nosotros": {
        view: "/modules/visitor/aboutUs/aboutUs.html",
        controller: null
    },
    "/contacto": {
        view: "/modules/visitor/contact/contact.html",
        controller: null
    },
    "/inciarSesion": {
        view: "/modules/visitor/login/login.html",
        controller: null
    },
    "/crearCuenta": {
        view: "/modules/visitor/createAccount.html",
        controller: null
    }
};