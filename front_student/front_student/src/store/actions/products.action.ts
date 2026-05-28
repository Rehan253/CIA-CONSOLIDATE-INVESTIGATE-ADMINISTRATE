import axios from "axios";
import Cookies from "js-cookie";
import { IProduct, ProductModificationStatus } from "../models/product.interface";
import { addNotification } from "./notifications.action";

// Plain Redux action type strings — same as before
export const ADD_PRODUCT: string = "ADD_PRODUCT";
export const EDIT_PRODUCT: string = "EDIT_PRODUCT";
export const REMOVE_PRODUCT: string = "REMOVE_PRODUCT";
export const LOAD_PRODUCTS: string = "LOAD_PRODUCTS";
export const CHANGE_PRODUCT_AMOUNT: string = "CHANGE_PRODUCT_AMOUNT";
export const CHANGE_PRODUCT_PENDING_EDIT: string = "CHANGE_PRODUCT_PENDING_EDIT";
export const CLEAR_PRODUCT_PENDING_EDIT: string = "CLEAR_PRODUCT_PENDING_EDIT";
export const SET_MODIFICATION_STATE: string = "SET_MODIFICATION_STATE";

// Axios instance pointing at our backend, same pattern as account.actions.ts
const instance = axios.create({
    baseURL: 'http://' + process.env.REACT_APP_API_URL,
    timeout: 5000,
});

// Helper to get the auth header — token is stored in a cookie after login
function authHeader() {
    return { auth: Cookies.get('token') };
}

// Fetch all products from the backend and replace whatever is in Redux state
export function loadProducts(): any {
    return async (dispatch: any) => {
        try {
            const response = await instance.get('/product/', { headers: authHeader() });
            dispatch({ type: LOAD_PRODUCTS, products: response.data });
        } catch (e) {
            dispatch(addNotification("Error", "Could not load products from server"));
        }
    };
}

// Save a product — POSTs if creating, PATCHes if editing.
// After saving we reload the full list so we always show what's actually in the DB.
export function saveProduct(product: IProduct, isCreate: boolean): any {
    return async (dispatch: any) => {
        try {
            if (isCreate) {
                await instance.post('/product/', product, { headers: authHeader() });
            } else {
                await instance.patch(`/product/${product.id}`, product, { headers: authHeader() });
            }
            dispatch(loadProducts());
            dispatch(addNotification("Success", `Product ${product.name} saved`));
        } catch (e) {
            dispatch(addNotification("Error", "Could not save product"));
        }
    };
}

// Delete a product by ID, then remove it from Redux state as well
export function deleteProductFromApi(id: number): any {
    return async (dispatch: any) => {
        try {
            await instance.delete(`/product/${id}`, { headers: authHeader() });
            dispatch(removeProduct(id));
            dispatch(addNotification("Product removed", "Product was deleted"));
        } catch (e) {
            dispatch(addNotification("Error", "Could not delete product"));
        }
    };
}

// These ones stay the same — they only update local Redux state
export function addProduct(product: IProduct): IAddProductActionType {
    return { type: ADD_PRODUCT, product: product };
}

export function editProduct(product: IProduct): IEditProductActionType {
    return { type: EDIT_PRODUCT, product: product };
}

export function removeProduct(id: number): IRemoveProductActionType {
    return { type: REMOVE_PRODUCT, id: id };
}

export function changeProductAmount(id: number, amount: number): IChangeProductAmountType {
    return { type: CHANGE_PRODUCT_AMOUNT, id: id, amount: amount };
}

export function changeSelectedProduct(product: IProduct): IChangeSelectedProductActionType {
    return { type: CHANGE_PRODUCT_PENDING_EDIT, product: product };
}

export function clearSelectedProduct(): IClearSelectedProductActionType {
    return { type: CLEAR_PRODUCT_PENDING_EDIT };
}

export function setModificationState(value: ProductModificationStatus): ISetModificationStateActionType {
    return { type: SET_MODIFICATION_STATE, value: value };
}

interface IAddProductActionType { type: string, product: IProduct };
interface IEditProductActionType { type: string, product: IProduct };
interface IRemoveProductActionType { type: string, id: number };
interface IChangeSelectedProductActionType { type: string, product: IProduct };
interface IClearSelectedProductActionType { type: string };
interface ISetModificationStateActionType { type: string, value: ProductModificationStatus };
interface IChangeProductAmountType { type: string, id: number, amount: number };
