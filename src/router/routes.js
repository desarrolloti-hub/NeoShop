//Definición de Rutas

/* ====== Visitor ====== */
import { loginController } from '../modules/visitor/login/loginController.js';
import { init404Controller } from '../modules/shared/errors/404Controller.js';
import { plansController } from '../modules/visitor/plans/plansController.js';
import { homeController } from '../modules/visitor/home/homeController.js';
import { aboutUsController } from '../modules/visitor/aboutUs/aboutUsController.js';
import { createAccountController } from '../modules/visitor/createAccount/createAccounController.js';
import { contactController } from '../modules/visitor/contact/contactController.js';
import { termsAndConditionsController } from '../modules/visitor/termsAndConditions/termsAndConditionsController.js';

/* ====== Admin ====== */
/*  Store  */
import { createStoreController } from '../modules/admin/store/createStoreController.js';

/*  Settings  */
import { settingsController } from '../modules/admin/settings/settingsController.js';

/*  perfil  */
import { updateProfileController } from '../modules/admin/profile/updateProfileController.js';

/*  dashboard  */
import { adminHomeController } from '../modules/admin/home/adminHomeController.js';

/*  clientes  */
import { readCustomersController } from '../modules/admin/customer/readCustomersController.js';
import { createCustomerController } from '../modules/admin/customer/createCustomerController.js';
import { updateCustomerController } from '../modules/admin/customer/updateCustomerController.js';

/*  proveedores  */
import { createSupplierController } from '../modules/admin/supplier/createSupplierController.js';
import { readSupplierController } from '../modules/admin/supplier/readSupplierController.js';
import { updateSupplierController } from '../modules/admin/supplier/updateSupplierController.js';

/*  caja  */
import { cashSessionStatusController } from '../modules/admin/cashSessionStatus/cashSessionStatusController.js';
import { readCashSessionsController } from '../modules/admin/cashSessionStatus/readCashSessionsController.js';

/*  productoss */
import { readProductsController } from '../modules/admin/products/readProductsController.js';
import { createProductController } from '../modules/admin/products/createProductController.js';
import { updateProductController } from '../modules/admin/products/updateProductController.js';

/*  ventas */
import { saleDetailController } from '../modules/admin/sales/detailSaleController.js';
import { saleListController } from '../modules/admin/sales/readSaleController.js';
import { saleCreateController } from '../modules/admin/sales/createSaleController.js';

/* colaboradores */
import { createPartnerController } from '../modules/admin/partners/createPartnerController.js';
import { updatePartnerController } from '../modules/admin/partners/updatePartnerController.js';
import { readPartnersController } from '../modules/admin/partners/readPartnersController.js';

/* categorias */
import { updateCategoryController } from '../modules/admin/category/updateCategoryController.js';
import { createCategoryController } from '../modules/admin/category/createCategoryController.js';
import { readCategoriesController } from '../modules/admin/category/readCategoriesController.js';

/* drivers */
import { initDriversController } from '../modules/admin/drivers/driversController.js';



export const routes = {
    // Rutas HTML
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: homeController
    },

    /* ====== Visitor ====== */
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

    /* ====== Admin ====== */
    /* customer */
    "/clientes": {
        view: "/modules/admin/customer/readCustomers.html",
        controller: readCustomersController
    },
    "/nuevoCliente": {
        view: "/modules/admin/customer/createCustomer.html",
        controller: createCustomerController
    },
    "/editarCliente": {
        view: "/modules/admin/customer/updateCustomer.html",
        controller: updateCustomerController
    },

    /* supplier */
    "/editarProveedor": {
        view: "/modules/admin/supplier/updateSupplier.html",
        controller: updateSupplierController
    },
    "/crearProveedor": {
        view: "/modules/admin/supplier/createSupplier.html",
        controller: createSupplierController
    },
    "/proveedores": {
        view: "/modules/admin/supplier/readSupplier.html",
        controller: readSupplierController
    },

    /* profile */
    "/editarPerfi": {
        view: "/modules/admin/profile/updateProfile.html",
        controller: updateProfileController
    },

    /* productos */
    "/productos": {
        view: "/modules/admin/products/readProducts.html",
        controller: readProductsController
    },
    "/crearProducto": {
        view: "/modules/admin/products/createProduct.html",
        controller: createProductController
    },
    "/editarProducto": {
        view: "/modules/admin/products/updateProduct.html",
        controller: updateProductController
    },

    /* caja */
    "/caja": {
        view: "/modules/admin/cashSessionStatus/cashSessionStatus.html",
        controller: cashSessionStatusController
    },
    "/estadoCaja": {
        view: "/modules/admin/cashSessionStatus/readCashSessions.html",
        controller: readCashSessionsController
    },

    /* Home partner */
    "/inicioColaborador": {
        view: "/modules/partner/home/homePartner.html",
        controller: null
    },


    /* Home */
    "/inicioAdmin": {
        view: "/modules/admin/home/adminHome.html",
        controller: adminHomeController
    },

    /* == ventas == */
    "/nuevaVenta": {
        view: "/modules/admin/sale/createSale.html",
        controller: saleCreateController
    },
    "/ventas": {
        view: "/modules/admin/sale/readSale.html",
        controller: saleListController
    },
    "/detallesVenta": {
        view: "/modules/admin/sale/detailSale.html",
        controller: saleDetailController
    },

    /*configuración */
    "/configuracion": {
        view: "/modules/admin/settings/settings.html",
        controller: settingsController
    },

    /* tienda */
    "/crearTienda": {
        view: "/modules/admin/store/createStore.html",
        controller: createStoreController
    },

    /* colaboradores */
    "/colaboradores": {
        view: "/modules/admin/partners/readPartners.html",
        controller: readPartnersController
    },
    "/crearColaborador": {
        view: "/modules/admin/partners/createPartner.html",
        controller: createPartnerController
    },
    "/editarColaborador": {
        view: "/modules/admin/partners/updatePartner.html",
        controller: updatePartnerController
    },

    /* categorias */
    "/crearCategoria": {
        view: "/modules/admin/category/createCategory.html",
        controller: createCategoryController
    },
    "/catalogoProductos": {
        view: "/modules/admin/category/readCategories.html",
        controller: readCategoriesController
    },
    "/editarCategoria": {
        view: "/modules/admin/category/updateCategory.html",
        controller: updateCategoryController
    },

    /* scanner */
    "/scanner": {
        view: "/modules/admin/drivers/drivers.html",
        controller: initDriversController
    },

    /* ====== Shared ====== */
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: init404Controller
    }
}