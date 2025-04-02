import frappe 
from frappe import _

from frappe.contacts.address_and_contact import load_address_and_contact
from frappe.email.inbox import link_communication_to_document
from frappe.model.mapper import get_mapped_doc
from frappe.query_builder import DocType, Interval
from frappe.query_builder.functions import Now
from frappe.utils import flt, get_fullname

from erpnext.setup.utils import get_exchange_rate
from erpnext.utilities.transaction_base import TransactionBase


@frappe.whitelist()
def make_quotation_from_cost_estimation(cost_estimation_id, target_doc=None):
    def set_missing_values(source, target):
        from erpnext.controllers.accounts_controller import (
            get_default_taxes_and_charges,
        )

        # Get the quotation document
        quotation = frappe.get_doc(target)

        company_currency = frappe.get_cached_value(
            "Company", quotation.company, "default_currency"
        )

        # Determine exchange rate
        if company_currency == quotation.currency:
            exchange_rate = 1
        else:
            exchange_rate = get_exchange_rate(
                quotation.currency,
                company_currency,
                quotation.transaction_date,
                args="for_selling",
            )

        quotation.conversion_rate = exchange_rate

        # Fetch default taxes and update
        taxes = get_default_taxes_and_charges(
            "Sales Taxes and Charges Template", company=quotation.company
        )
        if taxes.get("taxes"):
            quotation.update(taxes)

        # Run missing values and totals calculations
        quotation.run_method("set_missing_values")
        quotation.run_method("calculate_taxes_and_totals")

        # Link the opportunity if not already linked
        if not quotation.opportunity:
            quotation.opportunity = source.opportunity

    # Fetch the Cost Estimation document
    cost_estimation = frappe.get_doc("Cost Estimation", cost_estimation_id)
    if not cost_estimation.opportunity:
        frappe.throw("No Opportunity is linked with this Cost Estimation.")

    # Fetch items from the "Quotation Selling Items" child table
    selling_items = frappe.get_all(
        "Quotation Selling Items",
        filters={"parent": cost_estimation_id},
        fields=[
            "item_code",
            "quantity",
            "rate",
            "amount",
            "idx",
            "quote_price",
        ],
        order_by="idx",
    )

    if not selling_items:
        frappe.throw(f"No selling items found for Cost Estimation {cost_estimation_id}")

    # Fetch rows from the "Cost Estimation Expense" child table
    cost_estimation_expenses = frappe.get_all(
        "Cost Estimation Expense",
        filters={"parent": cost_estimation_id},
        fields=["item_code", "capacity", "moc", "quantity","particulars","uom"],
        order_by="idx",
    )

    # Map fields from Cost Estimation and Opportunity to Quotation
    doclist = get_mapped_doc(
        "Opportunity",
        cost_estimation.opportunity,
        {
            "Opportunity": {
                "doctype": "Quotation",
                "field_map": {"opportunity_from": "quotation_to", "name": "enq_no"},
            },
        },
        target_doc,
        set_missing_values,
    )

    # Append items from the Cost Estimation's "Quotation Selling Items" child table
    for item in selling_items:
        # Fetch item details
        item_details = frappe.get_value(
            "Item",
            item.item_code,
            ["item_name", "stock_uom"],
            as_dict=True,
        )

        if not item_details:
            frappe.throw(f"Item Code {item.item_code} not found in the Item master.")

        doclist.append(
            "items",
            {
                "item_code": item.item_code,
                "item_name": item_details.item_name,
                "uom": item_details.stock_uom,
                "qty": item.quantity,
                "rate": item.quote_price,
                "custom_estimated_rate": item.quote_price,
                # "amount": item.amount,
            },
        )

    # Append rows from the Cost Estimation's "Cost Estimation Expense" child table
    for expense in cost_estimation_expenses:
        doclist.append(
            "custom_quotation_cost_estimation_expense",
            {
                "item": expense.item_code,
                "specification": expense.capacity,
                "moc": expense.moc,
                "quantity": expense.quantity,
                "particulars":expense.particulars,
                "uom":expense.uom,
            },
        )

    # Link the Cost Estimation in the Quotation
    doclist.custom_cost_estimation = cost_estimation_id

    return doclist
