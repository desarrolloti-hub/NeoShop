/* ========================================
   ROUTES - Definición de rutas
   ======================================== */

// Importar controllers de vistas
import { loginController } from '../modules/visitor/login/loginController.js';
import { init404Controller } from '../modules/shared/errors/404Controller.js';
import { plansController } from '../modules/visitor/plans/plansController.js';
import { homeController } from '../modules/visitor/home/homeController.js';
import { aboutUsController } from '../modules/visitor/aboutUs/aboutUsController.js';


export const routes = {
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: homeController
    },
    "/planes": {
        view: "/modules/visitor/plans/plans.html",
        controller: plansController
    },
    "/ss": {
        view: "/src/views/services.html",
        controller: null
    },
    "/nosotros": {
        view: "/modules/visitor/aboutUs/aboutUs.html",
        controller: aboutUsController
    },
    "/contacto": {
        view: "/modules/visitor/contact/contact.html",
        controller: null
    },
    "/iniciarSesion": {
        view: "/modules/visitor/login/login.html",
        controller: loginController
    },
    "/crearCuenta": {
        view: "/modules/visitor/createAccount/createAccount.html",
        controller: null
    },
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: init404Controller
    }
}