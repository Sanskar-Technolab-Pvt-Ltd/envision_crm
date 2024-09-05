// frappe.ui.form.on("Cost Estimation", {
//   refresh: function (frm) {
//     // Call the function to set default values from the selling table into the child table
//     // SetDefaultSellingItemInsideChildItem(
//     //   "quotation_items",
//     //   "projects_department_cost_estimation"
//     // );

//     // Function to set default selling item and percentages inside the child table
//     // function SetDefaultSellingItemInsideChildItem(
//     //   SellingTableName,
//     //   ChildTableName
//     // ) {
//     //   // Check if there is one item in the selling table
//     //   if (frm.doc[SellingTableName].length === 1) {
//     //     console.log("after Length check  :", frm.doc[SellingTableName].length);

//     //     // Get the selling item code and percentages from the first row of the selling table
//     //     var SellingItem = frm.doc[SellingTableName][0]["item_code"];
//     //     var UnloadingPercentage =
//     //       frm.doc[SellingTableName][0]["unloading_percentage"] || 0;
//     //     // Uncomment these lines if you want to include these percentages
//     //     // var TransportationPercentage =
//     //     //   frm.doc[SellingTableName][0]["transportation_percentage"] || 0;
//     //     // var ErectionPercentage =
//     //     //   frm.doc[SellingTableName][0]["erection_percentage"] || 0;
//     //     // var ProfitPercentage =
//     //     //   frm.doc[SellingTableName][0]["profit_percentage"] || 0;

//     //     console.log("Selling Item Name  :", SellingItem);

//     //     // Attach the function to the grid-add-row button click event
//     //     $("[data-fieldname='" + ChildTableName + "'] .grid-add-row").on(
//     //       "click",
//     //       function () {
//     //         // Access the existing data in the child table or initialize it as an empty array
//     //         var ChildTableData = frm.doc[ChildTableName] || [];
//     //         console.log("Child Table Data ", ChildTableData);

//     //         // Get the last row added (this is the new row)
//     //         var last_row = ChildTableData[ChildTableData.length - 1];

//     //         // Set default values only if the fields are not manually overridden (undefined or null)
//     //         if (!last_row["selling_item"]) {
//     //           last_row["selling_item"] = SellingItem;
//     //         }
//     //         if (!last_row["unloading_percentage"]) {
//     //           last_row["unloading_percentage"] = UnloadingPercentage;
//     //         }
//     //         // Uncomment these lines if you want to include these percentages
//     //         // if (!last_row["transportation_percentage"]) {
//     //         //   last_row["transportation_percentage"] = TransportationPercentage;
//     //         // }
//     //         // if (!last_row["erection_percentage"]) {
//     //         //   last_row["erection_percentage"] = ErectionPercentage;
//     //         // }
//     //         // if (!last_row["profit_percentage"]) {
//     //         //   last_row["profit_percentage"] = ProfitPercentage;
//     //         // }

//     //         // Refresh the child table field to reflect changes in the UI
//     //         frm.refresh_field(ChildTableName);
//     //       }
//     //     );
//     //   } else {
//     //     // If the selling table doesn't have exactly one item, refresh the form to reset changes
//     //     frm.refresh();
//     //   }
//     // } // function SetDefaultSellingItemInsideChildItem closed
//   }, // refresh event closed
//   projects_department_cost_estimation_add: function (frm) {
//     console.log("Row is Added");
//   },
// }); // Frappe form UI closed
frappe.ui.form.on("Project Department Cost Estimation", {
  projects_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      set_selling_item_values(cdt, cdn, selling_table);
    }
  },

  selling_item: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];

    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_quotation_selling_items_details",
      args: {
        cost_estimation_id: current_row.parent,
        item_name: current_row.selling_item,
      },
      callback: function (r) {
        if (!r.exc) {
          set_selling_item_values(cdt, cdn, r.message);
        }
      },
    });
  },

  rate: function (frm, cdt, cdn) {
calculate_amount(cdt, cdn)
  },

  quantity: function (frm, cdt, cdn) {
    calculate_amount(cdt, cdn);
  },
});

// Function to set selling item values
function set_selling_item_values(cdt, cdn, data) {
  frappe.model.set_value(cdt, cdn, "selling_item", data.item_code);
  frappe.model.set_value(
    cdt,
    cdn,
    "unloading_percentage",
    data.unloading_percentage
  );
  frappe.model.set_value(
    cdt,
    cdn,
    "transportation_percentage",
    data.transportation_percentage
  );
  frappe.model.set_value(
    cdt,
    cdn,
    "erection_percentage",
    data.erection_percentage
  );
  frappe.model.set_value(cdt, cdn, "profit_percentage", data.profit_percentage);
}

// Function to calculate Amount
function calculate_amount(cdt, cdn) {
   let current_row = locals[cdt][cdn];
   // console.log(current_row);
   //   console.log("qty");
   let amount_value = current_row.quantity * current_row.rate;
   frappe.model.set_value(cdt, cdn, "amount", amount_value);

   let unloading_amount =
     (current_row.amount * current_row.unloading_percentage) / 100;
   console.log("unloading_amount", unloading_amount);
   frappe.model.set_value(cdt, cdn, "unloading_amount", unloading_amount);

   let transportation_amount =
     (current_row.amount * current_row.transportation_percentage) / 100;
   console.log("transportation_amount", transportation_amount);
   frappe.model.set_value(
     cdt,
     cdn,
     "transportation_amount",
     transportation_amount
   );

   let supply_amount =
     current_row.unloading_amount +
     current_row.transportation_amount +
     current_row.amount;
   console.log("supply_amount", supply_amount);
   frappe.model.set_value(cdt, cdn, "supply_amount", supply_amount);

   let erection_amount =
     (current_row.amount * current_row.erection_percentage) / 100;
   console.log("erection_amount", erection_amount);
   frappe.model.set_value(cdt, cdn, "erection_amount", erection_amount);
   console.log(
     "values ",
     current_row.supply_amount,
     current_row.erection_amount
   );

   let total_amount_with_erection =
     current_row.supply_amount + current_row.erection_amount;
   console.log("after");

   console.log("total_amount_with_erection", total_amount_with_erection);
   frappe.model.set_value(
     cdt,
     cdn,
     "total_amount_with_erection",
     total_amount_with_erection
   );
}
