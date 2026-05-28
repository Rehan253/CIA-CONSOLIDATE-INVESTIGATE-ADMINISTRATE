import React, { useState, FormEvent, Dispatch, Fragment } from "react";
import { IStateType, IProductState } from "../../store/models/root.interface";
import { useSelector, useDispatch } from "react-redux";
import { IProduct, ProductModificationStatus } from "../../store/models/product.interface";
import TextInput from "../../common/components/TextInput";
import { clearSelectedProduct, setModificationState, saveProduct } from "../../store/actions/products.action";
import NumberInput from "../../common/components/NumberInput";
import Checkbox from "../../common/components/Checkbox";
import SelectInput from "../../common/components/Select";
import { OnChangeModel } from "../../common/types/Form.types";

const ProductForm: React.FC = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const products: IProductState | null = useSelector((state: IStateType) => state.products);
  let product: IProduct | null = products.selectedProduct;
  const isCreate: boolean = (products.modificationState === ProductModificationStatus.Create);

  if (!product || isCreate) {
    product = { id: 0, name: "", description: "", amount: 0, price: 0, hasExpiryDate: false, category: "" };
  }

  const [formState, setFormState] = useState({
    name: { error: "", value: product.name },
    description: { error: "", value: product.description },
    amount: { error: "", value: product.amount },
    price: { error: "", value: product.price },
    hasExpiryDate: { error: "", value: product.hasExpiryDate },
    category: { error: "", value: product.category }
  });

  function hasFormValueChanged(model: OnChangeModel): void {
    setFormState({ ...formState, [model.field]: { error: model.error, value: model.value } });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (isFormInvalid()) {
      return;
    }
    if (product) {
      const updated: IProduct = {
        ...product,
        name: formState.name.value,
        description: formState.description.value,
        price: formState.price.value,
        amount: formState.amount.value,
        hasExpiryDate: formState.hasExpiryDate.value,
        category: formState.category.value
      };
      // saveProduct handles both create (POST) and edit (PATCH) based on the isCreate flag
      dispatch(saveProduct(updated, isCreate));
      dispatch(clearSelectedProduct());
      dispatch(setModificationState(ProductModificationStatus.None));
    }
  }

  function cancelForm(): void {
    dispatch(setModificationState(ProductModificationStatus.None));
  }

  function getDisabledClass(): string {
    return isFormInvalid() ? "disabled" : "";
  }

  function isFormInvalid(): boolean {
    return (formState.amount.error || formState.description.error
      || formState.name.error || formState.price.error || formState.hasExpiryDate.error
      || formState.category.error || !formState.name.value || !formState.category.value) as boolean;
  }

  return (
    <Fragment>
      <div className="col-xl-7 col-lg-7">
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-green">Product {(isCreate ? "create" : "edit")}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <TextInput id="input_name"
                    value={formState.name.value}
                    field="name"
                    onChange={hasFormValueChanged}
                    required={true}
                    maxLength={20}
                    label="Name"
                    placeholder="Name" />
                </div>
                <div className="form-group col-md-6">
                  <SelectInput
                    id="input_category"
                    field="category"
                    label="Category"
                    options={["Fruit", "Sweet", "Kitchen"]}
                    required={true}
                    onChange={hasFormValueChanged}
                    value={formState.category.value}
                  />
                </div>
              </div>
              <div className="form-group">
                <TextInput id="input_description"
                  field="description"
                  value={formState.description.value}
                  onChange={hasFormValueChanged}
                  required={false}
                  maxLength={100}
                  label="Description"
                  placeholder="Description" />
              </div>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <NumberInput id="input_amount"
                    value={formState.amount.value}
                    field="amount"
                    onChange={hasFormValueChanged}
                    max={1000}
                    min={0}
                    label="Amount" />
                </div>
                <div className="form-group col-md-6">
                  <NumberInput id="input_price"
                    value={formState.price.value}
                    field="price"
                    onChange={hasFormValueChanged}
                    max={1000}
                    min={0}
                    label="Price" />
                </div>
              </div>
              <div className="form-group">
                <Checkbox
                  id="checkbox_expiry"
                  field="hasExpiryDate"
                  value={formState.hasExpiryDate.value}
                  label="Has expiry date"
                  onChange={hasFormValueChanged}
                />
              </div>
              <button className="btn btn-danger" onClick={() => cancelForm()}>Cancel</button>
              <button type="submit" className={`btn btn-success left-margin ${getDisabledClass()}`}>Save</button>
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ProductForm;
