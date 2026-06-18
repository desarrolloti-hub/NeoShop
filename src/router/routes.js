/* ========================================
   ROUTES - Definición de rutas
   ======================================== */

// Visitor
import { loginController } from '../modules/visitor/login/loginController.js';
import { init404Controller } from '../modules/shared/errors/404Controller.js';
import { plansController } from '../modules/visitor/plans/plansController.js';
import { homeController } from '../modules/visitor/home/homeController.js';
import { aboutUsController } from '../modules/visitor/aboutUs/aboutUsController.js';
import { createAccountController } from '../modules/visitor/createAccount/createAccounController.js';
import { contactController } from '../modules/visitor/contact/contactController.js';
import { termsAndConditionsController } from '../modules/visitor/termsAndConditions/termsAndConditionsController.js';
/* ========================================
      ----------- store -----------
======================================== */

import { createStoreController } from '../modules/admin/store/create/createStoreController.js';



/* ========================================
     ----------- settings -----------
======================================== */

import { settingsController } from '../modules/admin/settings/settingsController.js';




/* ========================================
     ----------- profile -----------
======================================== */
import { updateProfileController } from '../modules/admin/profile/updateProfileController.js';


/* ========================================
       ----------- home -----------
 ======================================== */

import { adminHomeController } from '../modules/admin/home/adminHomeController.js';


/* ========================================
       ----------- customer -----------
 ======================================== */
import { readCustomerController } from '../modules/admin/customer/readCustomerController.js';



/* ========================================
     ----------- Supplier -----------
======================================== */

import { createSupplierController } from '../modules/admin/supplier/create/createSupplierController.js';
import { readSupplierController } from '../modules/admin/supplier/read/readSupplierController.js';
import { updateSupplierController } from '../modules/admin/supplier/update/updateSupplierController.js';


/* ========================================
 ----------- cashSessionStatus -----------    
======================================== */

import { cashSessionStatusController } from '../modules/admin/cashSessionStatus/cashSessionStatusController.js';
import { readCashSessionsController } from '../modules/admin/cashSessionStatus/read/readCashSessionsController.js';


/* ========================================
 ----------- productos -----------    
======================================== */

import { readProductsController } from '../modules/admin/products/read/readProductsController.js';
import { createProductController } from '../modules/admin/products/create/createProductController.js';
import { updateProductController } from '../modules/admin/products/update/updateProductController.js';

/* == ventas == */
import { saleDetailController } from '../modules/admin/sales/detail/detailSaleController.js';
import { saleListController } from '../modules/admin/sales/read/readSaleController.js';
import { saleCreateController } from '../modules/admin/sales/create/createSaleController.js';

/* colaboradores */
import { createPartnerController } from '../modules/admin/partners/create/createPartnerController.js'
import { updatePartnerController } from '../modules/admin/partners/update/updatePartnerController.js'
import { readPartnersController } from '../modules/admin/partners/read/readPartnersController.js'


/* ========================================
                Rutas HTML 
   ======================================== */





/* ================================================================================
       --------------------------------- Visitor ---------------------------------
   ================================================================================ */

export const routes = {
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: homeController
    },
    "/planes": {
        view: "/modules/visitor/plans/plans.html",
        controller: plansController
    },
    "/nosotros": {
        view: "/modules/visitor/aboutUs/aboutUs.html",
        controller: aboutUsController
    },
    "/contacto": {
        view: "/modules/visitor/contact/contact.html",
        controller: contactController
    },
    "/iniciarSesion": {
        view: "/modules/visitor/login/login.html",
        controller: loginController
    },
    "/crearCuenta": {
        view: "/modules/visitor/createAccount/createAccount.html",
        controller: createAccountController
    },
    "/terminosYCondiciones": {
        view: "/modules/visitor/termsAndConditions/termsAndConditions.html",
        controller: termsAndConditionsController,
    },




    /* ================================================================================
           --------------------------------- Admin ---------------------------------
       ================================================================================ */


    /* customer */
    "/clientes": {
        view: "/modules/admin/customer/readCustomer.html",
        controller: readCustomerController
    },

    /* supplier */
    "/editarProveedor": {
        view: "/modules/admin/supplier/update/updateSupplier.html",
        controller: updateSupplierController
    },
    "/crearProveedor": {
        view: "/modules/admin/supplier/create/createSupplier.html",
        controller: createSupplierController
    },
    "/proveedores": {
        view: "/modules/admin/supplier/read/readSupplier.html",
        controller: readSupplierController
    },

    /* profile */
    "/editarPerfil": {
        view: "/modules/admin/profile/updateProfile.html",
        controller: updateProfileController
    },

    /* ver producto */
    "/productos": {
        view: "/modules/admin/products/read/readProducts.html",
        controller: readProductsController
    },

    /* crear producto */
    "/crearProducto": {
        view: "/modules/admin/products/create/createProduct.html",
        controller: createProductController
    },

    /* editar producto */
    "/editarProducto": {
        view: "/modules/admin/products/update/updateProduct.html",
        controller: updateProductController
    },

    /* ========================================
     ----------- cashSessionStatus -----------    
    ======================================== */

    "/caja": {
        view: "/modules/admin/cashSessionStatus/cashSessionStatus.html",
        controller: cashSessionStatusController
    },


    "/estadoCaja": {
        view: "/modules/admin/cashSessionStatus/read/readCashSessions.html",
        controller: readCashSessionsController
    },




    "/inicioAdmin": {
        view: "/modules/admin/home/adminHome.html",
        controller: adminHomeController
    },
    "/tienda": {
        view: "/modules/admin/store/create/createStore.html",
        controller: createStoreController
    },
    /* == ventas == */
    "/nuevaVenta": {
        view: "/modules/admin/sale/create/createSale.html",
        controller: saleCreateController
    },
    "/ventas": {
        view: "/modules/admin/sale/read/readSale.html",
        controller: saleListController
    },
    "/detallesVenta": {
        view: "/modules/admin/sale/detail/detailSale.html",
        controller: saleDetailController
    },
    /*settings */
    "/configuracion": {
        view: "/modules/admin/settings/settings.html",
        controller: settingsController
    },

    /*store */
    "/crearTienda": {
        view: "/modules/admin/store/create/createStore.html",
        controller: createStoreController
    },
    /* colaboradores */
    "/colaboradores": {
        view: "/modules/admin/partners/read/readPartners.html",
        controller: readPartnersController
    },
    "/crearColaborador": {
        view: "/modules/admin/partners/create/createPartner.html",
        controller: createPartnerController
    },
    "/editarColaborador": {
        view: "/modules/admin/partners/update/updatePartner.html",
        controller: updatePartnerController
    },

    /* ========================================
         ----------- Todos -----------
   ======================================== */
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: init404Controller
    }
}