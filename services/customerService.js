/* ========================================
   CUSTOMER SERVICE - Business logic for customers
   Dynamic collection: customers + StoreName
   ======================================== */

import { Customer } from '/classes/customerModel.js';
import { CustomerRepository } from '/repositories/customerRepository.js';
import { CacheService } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

// Cache store name
const CACHE_STORE = 'customers';

export const CustomerService = {
    /**
     * Create new customer
     * Collection will be: customers + StoreName (e.g., "customersOrienTienda")
     * Document ID will be: cus_timestamp_random (e.g., "cus_1700000000_abc123")
     */
    async create(customerData) {
        // ========== GET STORE INFO FROM SESSION ==========
        const session = AdminService.getSession();
        if (!session) {
            throw new Error('User not authenticated');
        }

        const storeId = session.storeId;
        const storeName = session.storeName;
        const adminName = session.fullName || session.name;
        const adminEmail = session.email;

        if (!storeId || !storeName) {
            throw new Error('Store information not found in session');
        }

        // ========== VALIDATIONS ==========
        if (!customerData.name || customerData.name.trim().length < 2) {
            throw new Error('Customer name must be at least 2 characters long');
        }

        if (!customerData.email || !this._validateEmail(customerData.email)) {
            throw new Error('Invalid email address');
        }

        if (!customerData.rfc || customerData.rfc.trim().length < 12) {
            throw new Error('RFC must be at least 12 characters long');
        }

        if (!customerData.phone || customerData.phone.trim().length < 10) {
            throw new Error('Phone must have at least 10 digits');
        }

        if (!customerData.fiscalAddress?.street) {
            throw new Error('Street is required');
        }

        if (!customerData.fiscalAddress?.city) {
            throw new Error('City is required');
        }

        if (!customerData.fiscalAddress?.state) {
            throw new Error('State is required');
        }

        const cleanName = customerData.name.trim();
        const cleanEmail = customerData.email.toLowerCase().trim();
        const cleanRfc = customerData.rfc.trim().toUpperCase();

        // ========== CHECK DUPLICATES ==========
        // Check if customer with this email already exists in the store
        const existingByEmail = await CustomerRepository.getByEmail(cleanEmail, storeName);
        if (existingByEmail) {
            throw new Error(`A customer with email "${cleanEmail}" already exists in this store`);
        }

        // Check if customer with this RFC already exists in the store
        const existingByRfc = await CustomerRepository.getByRfc(cleanRfc, storeName);
        if (existingByRfc) {
            throw new Error(`A customer with RFC "${cleanRfc}" already exists in this store`);
        }

        // ========== GENERATE RANDOM ID ==========
        const customerId = Customer.generateId();

        // ========== CREATE MODEL ==========
        const customer = new Customer({
            id: customerId,
            email: cleanEmail,
            name: cleanName,
            rfc: cleanRfc,
            phone: customerData.phone.trim(),
            fiscalAddress: {
                street: customerData.fiscalAddress.street.trim(),
                neighborhood: customerData.fiscalAddress.neighborhood?.trim() || '',
                postalCode: customerData.fiscalAddress.postalCode?.trim() || '',
                city: customerData.fiscalAddress.city.trim(),
                state: customerData.fiscalAddress.state.trim(),
                references: customerData.fiscalAddress.references?.trim() || ''
            },
            storeId: storeId,
            createdBy: adminName,
            createdByEmail: adminEmail,
            active: true
        });

        // ========== SAVE TO FIRESTORE (Dynamic collection) ==========
        const result = await CustomerRepository.save(customer, storeName);

        // Clear cache
        await CacheService.clearCache(CACHE_STORE);

        return new Customer(result);
    },

    /**
     * Get customer by ID
     */
    async getById(customerId, storeName = null, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;
            if (!storeName) {
                throw new Error('Store name is required to get customer data');
            }
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(CACHE_STORE, `${customerId}_${storeName}`);
            if (cached) {
                return new Customer(cached);
            }
        }

        const customerData = await CustomerRepository.getById(customerId, storeName);

        if (customerData) {
            await CacheService.setCache(CACHE_STORE, `${customerId}_${storeName}`, customerData, 3600000);
            return new Customer(customerData);
        }

        return null;
    },

    /**
     * Get customer by email
     */
    async getByEmail(email, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;
            if (!storeName) {
                throw new Error('Store name is required to get customer data');
            }
        }

        const customerData = await CustomerRepository.getByEmail(email, storeName);
        return customerData ? new Customer(customerData) : null;
    },

    /**
     * Get all customers for current store
     */
    async getAll(filters = {}, forceRefresh = false) {
        const session = AdminService.getSession();
        const storeName = session?.storeName;
        const storeId = session?.storeId;

        if (!storeName) {
            throw new Error('Store name is required to get customers');
        }

        if (!forceRefresh) {
            const cacheKey = `customers_list_${storeName}_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(CACHE_STORE, cacheKey);
            if (cached) {
                return cached.map(c => new Customer(c));
            }
        }

        const customersData = await CustomerRepository.getAll(storeName, { ...filters, storeId });
        const customers = customersData.map(c => new Customer(c));

        const cacheKey = `customers_list_${storeName}_${JSON.stringify(filters)}`;
        await CacheService.setCache(CACHE_STORE, cacheKey, customersData, 1800000);

        return customers;
    },

    /**
     * Update customer
     */
    async update(customerId, updateData) {
        const session = AdminService.getSession();
        const storeName = session?.storeName;

        if (!storeName) {
            throw new Error('Store name is required to update customer');
        }

        // Get current customer
        const currentCustomer = await this.getById(customerId, storeName, true);
        if (!currentCustomer) {
            throw new Error('Customer not found');
        }

        // ========== VALIDATIONS ==========
        if (updateData.name && updateData.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }

        if (updateData.email && !this._validateEmail(updateData.email)) {
            throw new Error('Invalid email address');
        }

        if (updateData.rfc && updateData.rfc.trim().length < 12) {
            throw new Error('Invalid RFC');
        }

        if (updateData.phone && updateData.phone.trim().length < 10) {
            throw new Error('Phone must have at least 10 digits');
        }

        // Check email duplication if email is being changed
        if (updateData.email && updateData.email !== currentCustomer.email) {
            const existingByEmail = await CustomerRepository.getByEmail(updateData.email.trim().toLowerCase(), storeName);
            if (existingByEmail) {
                throw new Error(`A customer with email "${updateData.email}" already exists in this store`);
            }
        }

        // Check RFC duplication if RFC is being changed
        if (updateData.rfc && updateData.rfc !== currentCustomer.rfc) {
            const existingByRfc = await CustomerRepository.getByRfc(updateData.rfc.trim().toUpperCase(), storeName);
            if (existingByRfc) {
                throw new Error(`A customer with RFC "${updateData.rfc}" already exists in this store`);
            }
        }

        // Prepare update data
        const updatedData = {
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        // Format specific fields
        if (updatedData.email) {
            updatedData.email = updatedData.email.trim().toLowerCase();
        }
        if (updatedData.rfc) {
            updatedData.rfc = updatedData.rfc.trim().toUpperCase();
        }
        if (updatedData.name) {
            updatedData.name = updatedData.name.trim();
        }
        if (updatedData.phone) {
            updatedData.phone = updatedData.phone.trim();
        }

        const updated = await CustomerRepository.update(customerId, storeName, updatedData);

        // Clear cache
        await CacheService.clearCache(CACHE_STORE);

        return new Customer(updated);
    },

    /**
     * Delete customer (soft delete)
     */
    async delete(customerId, hardDelete = false) {
        const session = AdminService.getSession();
        const storeName = session?.storeName;

        if (!storeName) {
            throw new Error('Store name is required to delete customer');
        }

        const customer = await this.getById(customerId, storeName, true);
        if (!customer) {
            throw new Error('Customer not found');
        }

        await CustomerRepository.delete(customerId, storeName, hardDelete);

        // Clear cache
        await CacheService.clearCache(CACHE_STORE);

        return true;
    },

    /**
     * Get customers by store ID
     */
    async getByStoreId(storeId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;
            if (!storeName) {
                throw new Error('Store name is required to get customers');
            }
        }

        const customersData = await CustomerRepository.getByStoreId(storeId, storeName);
        return customersData.map(c => new Customer(c));
    },

    /**
     * Get customer count
     */
    async getCount(filters = {}) {
        const session = AdminService.getSession();
        const storeName = session?.storeName;

        if (!storeName) {
            throw new Error('Store name is required to get customer count');
        }

        return await CustomerRepository.getCount(storeName, filters);
    },

    /**
     * Bulk create customers
     */
    async bulkCreate(customersData) {
        const session = AdminService.getSession();
        const storeName = session?.storeName;
        const storeId = session?.storeId;
        const adminName = session?.fullName || session?.name;
        const adminEmail = session?.email;

        if (!storeName) {
            throw new Error('Store name is required to create customers');
        }

        const customers = [];
        const errors = [];

        for (let i = 0; i < customersData.length; i++) {
            try {
                const data = customersData[i];
                const customer = new Customer({
                    ...data,
                    storeId: storeId,
                    createdBy: adminName,
                    createdByEmail: adminEmail,
                    id: Customer.generateId()
                });
                customers.push(customer);
            } catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to create some customers: ${JSON.stringify(errors)}`);
        }

        const results = await CustomerRepository.bulkCreate(customers, storeName);

        // Clear cache
        await CacheService.clearCache(CACHE_STORE);

        return results.map(c => new Customer(c));
    },

    /**
     * Search customers by name or email
     */
    async search(query, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;
            if (!storeName) {
                throw new Error('Store name is required to search customers');
            }
        }

        // Get all customers and filter client-side for search
        const allCustomers = await this.getAll({ active: true });

        const searchLower = query.toLowerCase().trim();
        return allCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.rfc.toLowerCase().includes(searchLower) ||
            customer.phone.includes(searchLower)
        );
    },

    /**
     * Validate email format
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate RFC format (basic validation)
     */
    _validateRfc(rfc) {
        return rfc && rfc.trim().length >= 12 && /^[A-Z0-9]+$/.test(rfc.trim().toUpperCase());
    },

    /**
     * Validate phone format
     */
    _validatePhone(phone) {
        return phone && phone.trim().length >= 10 && /^[0-9]+$/.test(phone.trim());
    },

    /**
     * Check if customer has any orders (could be expanded)
     */
    async hasOrders(customerId, storeName = null) {
        return false;
    }
};