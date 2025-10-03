// Copyright (c) 2025, Prompt Group and contributors
// For license information, please see license.txt

frappe.ui.form.on("Tender Opportunity", {

    refresh(frm) {
        //? CREATE BANK GURANTEE FROM TENDER OPPORTUNITY
        createPerformanceBankGuarantee(frm);

        // ? CREATE EMD FROM TENDER OPPORTUNITY
        createEMD(frm);

        // ? DEPARTMENT FILTER ON CAMPAIGN OWNER AND CO OWNER
        // apply_department_filters_for_user_employee_sales_person(frm,"opportunity_owner","User")
        // apply_department_filters_for_user_employee_sales_person(frm,"opportunity_coowner","User")

        // ! ADDRESS AND CONTACT FETCH IN HTML FIELDS
        // addressContactFetch(frm);

        // ? ADDRESS FILTER
//        apply_location_filters(frm, {
//            state_field: "state",
//            district_field: "district",
//            sub_district_field: "sub_district",
//            city_field: "cityvillage"
//        });

        // // ? SHOW CREATE PROJECT BUTTON
        // showCreateProjectButton(frm);

        // ? SHOW CREATE QUOTATION BUTTON
        showCreateQuotationButton(frm);

        // ? UPDATE PARTY FIELD DYNAMICALLY
        updatePartyLabel(frm);

        // // ? SHOW CREATE SALES CONTRACT BUTTON
        // showCreateSalesContractButton(frm);

        // ? SHOW PRODUCT CATEGORY POPUP
        // showHistoryPopupOnProductCategoryField(frm);

        // ? CUSTOMETR FILTER
//        filterForApprovedCustomer(frm,"party");

    },
    setup(frm) {

        // ? ADDRESS FILTERS
        addressFilters(frm);

        // ? UPDATE OPPURTUNITY FROM OPTIONS
        updateOpportunityFromOptions(frm);
    },
    opportunity_from(frm) {

        // ? UPDATE PARTY FIELD DYNAMICALLY
        updatePartyLabel(frm);
    },
    party(frm) {

        // ? ADDRESS SET FOR PARTY
        if (frm.is_new() && !frm.doc.customer_address) {
            //? IF FORM IS NEW AND CUSTOMER ADDRESS IS EMPTY
            set_primary_billing_address(frm);
        }

        // ? UPDATE LEAD DETAILS
        // updateLeadDetails(frm);
    },
    customer_address: function (frm) {

        // ? ADDRESS DISPLAY ON ADDRESS SELECT
        addressDisplayOnAddressSelect(frm);
    },
    status(frm) {
        // ? UPDATE PROBABILITY FIELD
        update_probability_based_on_status(frm);
    },
    opportunity_owner(frm) {
        // ? SET SALES PERSON FOR TENDER OPPORTUNITY OWNER
        setSalesPersonForSessionUser(frm, frm.doc.opportunity_owner);
    }
});

// ? ADDRESS SET ON CUSTOMER ADDRESS
function set_primary_billing_address(frm) {
    if (frm.doc.party) {
        frappe.call({
            method: "envision_crm.envision_crm.doctype.tender_opportunity.tender_opportunity.get_primary_billing_address_for_customer",
            args: { "customer": frm.doc.party },
            callback: function (r) {
                if (r.message) {
                    // console.log(r.message)
                    frm.set_value("customer_address", r.message.name);
                }
            }
        })
    }
}


// ! ADDRESS CONTACT FETCH SET FUNCTION
// addressContactFetch(frm){
//     if (!frm.is_new()) {
// 		frappe.contacts.render_address_and_contact(frm);
// 		// frm.trigger('render_contact_day_html');
// 	} else {
// 		frappe.contacts.clear_address_and_contact(frm);
// 	}
// }

// ? ADDRESS FILTER FUNCTION
function addressFilters(frm) {
    frm.set_query("customer_address", () => ({
        filters: [
            ["Dynamic Link", "link_doctype", "=", frm.doc.opportunity_from],
            ["Dynamic Link", "link_name", "=", frm.doc.party],
            ["disabled", "=", 0]
        ]
    }));
}

// ? ADDRESS DISPLAY
function addressDisplayOnAddressSelect(frm) {
    if (frm.doc.customer_address) {
        frappe.call({
            method: "frappe.contacts.doctype.address.address.get_address_display",
            args: {
                address_dict: frm.doc.customer_address,
            },
            callback: function (r) {
                frm.set_value("address_display", r.message);
            },
        });
    }
    if (!frm.doc.customer_address) {
        frm.set_value("address_display", "");
    }
}

// ? FUNCTION TO SHOW CREATE BUTTON
function showCreateProjectButton(frm) {

    // ? IF FORM IS NOT NEW
    if (!frm.is_new()) {

        // ? CHECK IF A PROJECT EXISTS
        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: "Project",
                filters: {
                    "custom_tender_opportunity": frm.doc.name,
                },
                fieldname: ["name"],
                as_dict: 0
            },
            callback: function (res) {

                if (res.message) {
                    let hasValidQuotation = res.message.length > 0;

                    // ? ADD CREATE QUOTATION BUTTON ONLY IF NO VALID QUOTATION EXISTS
                    if (!hasValidQuotation) {
                        // ? ADD CREATE PROJECT BUTTON
                        frm.add_custom_button("Project", function () {
                            createProject(frm);
                        }, "Create")
                    }
                }
            }
        });

    }
}

function showCreateQuotationButton(frm) {
    // ? IF FORM IS NOT NEW
    if (!frm.is_new() && frappe.session.user === frm.doc.owner) {

        // ? CHECK IF A QUOTATION EXISTS
        frappe.call({
            method: "envision_crm.envision_crm.api.controller.get_list_of_available_records ",
            args: {
                doctype: "Quotation",
                filters: { custom_tender_opportunity: frm.doc.name },
                fields: ['name'],
                limit_page_length: 1
            },
            callback: function (res) {

                if (res.message) {
                    let hasValidQuotation = res.message.length > 0;

                    // ? ADD CREATE QUOTATION BUTTON ONLY IF NO VALID QUOTATION EXISTS
                    if (!hasValidQuotation) {
                        frm.add_custom_button("Quotation", function () {
                            createQuotation(frm);
                        }, "Create");
                    }
                }
            }
        });
    }
}

// ? FUNCTION TO CREATE PROJECT
function createProject(frm) {

    // ? GET THE PROJECT TEMPLATE
    const projectTemplate = frm.doc?.project_template;

    // ? CREATE DIALOG
    dialog = new frappe.ui.Dialog({
        title: __('Create Project'),
        fields: [
            {
                fieldtype: 'Data',
                fieldname: 'project_name',
                label: __('Project Name'),
                reqd: 1,
            }
        ],
        primary_action_label: __('Create'),
        primary_action(values) {
            frappe.call({
                method: "prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_project",
                args: {
                    tender_opportunity: frm.doc.name,
                    project_name: values.project_name,
                    project_template: projectTemplate ? projectTemplate : null,
                },
                callback: function (response) {

                    // ? IF SUCCESS
                    if (response.message.success) {

                        // ? SET THE PROJECT FIELD
                        frm.set_value("project", response.message.data);
                        frm.refresh_field("project");
                        frm.save()
                        frappe.show_alert({
                            message: __('Project created successfully'),
                            indicator: 'green'
                        });
                    } else {
                        frappe.msgprint({
                            message: __('Failed to create project'),
                            indicator: 'red'
                        });
                    }
                }
            });
            dialog.hide();
        }
    });

    dialog.show()
}

// ? FUNCTION TO UPDATE PARTY FIELD LABEL
function updatePartyLabel(frm) {

    // ? IF OPPORTUNITY FROM
    if (frm.doc.opportunity_from) {

        // ? GET THE NEW LABEL
        let newLabel = (frm.doc.opportunity_from === "Lead") ? "Lead" : "Customer";

        // ? UPDATE THE PARTY FIELD LABEL
        frm.set_df_property("party", "label", newLabel);
        frm.refresh_field("party");
    }
}

// ? FUNCTION TO CREATE QUOTATION
function createQuotation(frm) {

    // if (!frm.doc.items || frm.doc.items.length === 0) {
    //     frappe.show_alert(
    //         { message: 'Please Add Items To Create a Quotation.', indicator: 'blue' });
    //     return;
    // }
    frappe.new_doc('Quotation', {
        quotation_to: frm.doc.opportunity_from,
        party_name: frm.doc.party,
        custom_tender_opportunity: frm.doc.name,
        custom_quotation_type: "Tender",
        custom_sales_person: frm.doc.custom_sales_person
    });
    // frappe.call({
    //     method: "prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_quotation",
    //     args: {
    //         quotation_to: frm.doc.opportunity_from,
    //         party_name: frm.doc.party,
    //         tender_opportunity: frm.doc.name,
    //         items: frm.doc.items ? frm.doc.items.map(row => ({
    //             item_code: row.item_code,
    //             qty: row.qty,
    //             rate: row.rate
    //         })) : []
    //     },
    //     callback: function (response) {
    //         if (response.message.success) {

    //             frappe.show_alert({
    //                 message: __('Quotation created successfully'),
    //                 indicator: 'green'
    //             });

    //             // ? OPEN THE NEW QUOTATION
    //             frappe.set_route('Form', 'Quotation', response.message.data);
    //         } else {
    //             frappe.msgprint({
    //                 message: __('Failed to create Quotation'),
    //                 indicator: 'red'
    //             });
    //         }
    //     }
    // });

}

// ? FUNCTION TO UPDATE OPPORTUNITY FROM OPTIONS
function updateOpportunityFromOptions(frm) {

    // ? SET QUERY FOR OPPORTUNITY FROM FIELD
    frm.set_query("opportunity_from", function () {
        return {
            filters: [["name", "in", ["Customer"]]]
        };
    });

}

// ? FUNCTION TO SHOW CREATE SALES CONTRACT BUTTON
function showCreateSalesContractButton(frm) {
    // ? IF FORM IS NOT NEW
    if (!frm.is_new()) {

        // ? CHECK IF STATUS IS WE ARE L1
        if (frm.doc.status === "We are L1") {

            // ? ADD CREATE QUOTATION BUTTON
            frm.add_custom_button("Sales Contract", function () {
                createSalesContract(frm);
            }, "Create");
        }

        else {
            // ? REMOVE CREATE QUOTATION BUTTON
            frm.remove_custom_button("Quotation", "Create");
        }

    }
}

// ? FUNCTION TO CREATE SALES CONTRACT
function createSalesContract(frm) {

    // ? GET THE SUBMITTED QUOATION WITH TENDER OPPURINITY REFERENCE
    frappe.call({
        method: "prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_sales_contract",
        args: {
            tender_opportunity: frm.doc.name,
        },
        callback: function (response) {
            if (response.message.success) {

                // ? GET MAPPED DOC
                let blanketOrderData = response.message.data;

                // ? SYNC DOC AND ROUTE TO IT
                frappe.model.sync(blanketOrderData);
                frappe.set_route("Form", "Blanket Order", blanketOrderData.name);

            } else {
                frappe.msgprint({
                    message: __('Failed to create Sales Contract'),
                    indicator: 'red'
                });
            }
        }
    })
}

// // ? FUNCTION TO UPDATE LEAD DETAILS
// function updateLeadDetails(frm){

//     // ? IF OPPORTUNITY FROM IS LEAD AND PARTY NAME EXISTS
//         if (frm.doc.opportunity_from === "Lead" && frm.doc.party && frm.doc.party !== "") {

//             // ? GET THE LEAD DETAILS
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "Lead",
//                     filters: {
//                         name: frm.doc.party
//                     },
//                     fieldname: ["source", "owner", "creation"]
//                 },
//                 callback: function (response) {

//                     // ? IF SUCCESS
//                     if (response.message) {

//                         // ? SET THE LEAD DETAILS
//                         frm.set_value("lead_source", response.message.source);
//                         frm.set_value("lead_created_by", response.message.owner);
//                         frm.set_value("lead_creation_date", response.message.creation);
//                     }
//                 }
//             });
//         }
//         else {
//             // ? SET THE LEAD DETAILS TO NULL
//             frm.set_value("lead_source", null);
//             frm.set_value("lead_created_by", null);
//             frm.set_value("lead_creation_date", null);
//         }

// }

// ? UPDATE THE AMOUNT BASED ON QTY AND RATE IN ITEMS FIELD OF A TENDER OPPORTUNITY
frappe.ui.form.on('Tender Opportunity Items', {
    qty: function (frm, cdt, cdn) {
        update_amount(cdt, cdn);
    },
    rate: function (frm, cdt, cdn) {
        update_amount(cdt, cdn);
    }
});

// ? FUNCTION TO UPDATE AMOUNT BASED ON RATE AND QTY
function update_amount(cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.qty && row.rate) {
        frappe.model.set_value(cdt, cdn, 'amount', row.qty * row.rate);
    }
}

// ? FUNCTION TO SET THE PROBABILITY FIELD BASED ON THE STATUS
function update_probability_based_on_status(frm) {
    // ? PROBABILITY PERCENT ACCORDING TO STATUS
    const probability_map = {
        'Tender Invitation Received': 1,
        'Pre Bid Meeting Completed': 0,
        'Tender Not Quoted': 0,
        'Tender Filling In-progress': 10,
        'Tender Submitted': 30,
        'Demo': 0,
        'Technical Bid Opened': 40,
        'Technically Qualified': 50,
        'Technically Disqualified': 0,
        'Price Bid Opened': 60,
        'Negotiation / Review': 70,
        'We are L1': 75,
        'Closed Won - Tender': 100,
        'Closed Lost to Competition': 0,
        'Delayed / On Hold': 50,
        'Gone for Re-Tendering': 1,
        'Tender Cancelled': 0,
    };

    // ? SET PROBABILITY
    let new_probability = probability_map[frm.doc.status] || 0;
    frm.set_value('probability', new_probability);
}

// ? FUNCTION TO CREATE PRODUCT CATEGORY POPUP
function createProductCategoryPopup(frm, parentElement, content) {

    // ? REMOVE EXISTING POPUP
    const existingPopup = document.querySelector(".popup-dropdown");
    if (existingPopup) {
        existingPopup.remove();
    }

    // ? CREATE THE POPUP STRUCTURE
    const popup = document.createElement("div");
    popup.className = "popup-dropdown";
    popup.innerHTML = `
    <div class="container p-0" style="display: flex; flex-direction: column; font-size:13.8px; max-height: 400px; overflow-y: auto;">
        ${content}
    </div>
    `;

    // ? APPLY POPUP STYLES
    parentElement[0].style.position = "relative";
    popup.style.position = "absolute";
    popup.style.left = "0px";
    popup.style.bottom = "42px";
    popup.style.padding = "10px";
    popup.style.backgroundColor = "#ffffff";
    popup.style.borderRadius = "5px";
    popup.style.boxShadow = "0px 0px 9px 7px rgba(77,77,77,0.5)";
    popup.style.zIndex = "1000";
    popup.style.width = "100%";

    // ? APPEND POPUP TO THE PARENT ELEMENT
    parentElement[0].appendChild(popup);

    // ? HIDE POPUP ON FOCUS OUT
    frm.fields_dict.items.grid.wrapper.on(
        "focusout",
        'input[data-fieldname="product_category"][data-doctype="Tender Opportunity Items"]',
        function () {
            if (popup) {
                popup.remove();
            }
        }
    );
}

// ? FUNCTION TO SHOW POPUP ON PRODUCT CATEGORY FIELD OF ITEM TABLE
function showHistoryPopupOnProductCategoryField(frm) {
    // ? DEBOUNCE TIMER
    let debounceTimer;

    // ? ADD EVENT LISTENER TO SHOW THE POPUP ON FOCUS
    frm.fields_dict.items.grid.wrapper.on(
        "focus",
        'input[data-fieldname="product_category"][data-doctype="Tender Opportunity Items"]',
        function (e) {

            // ? CLEAR TIMEOUT
            clearTimeout(debounceTimer);

            // ? SET DEBOUNCE
            debounceTimer = setTimeout(() => {

                const parentElement = $(this).closest(".grid-row");
                const rowIndex = parseInt($(this).closest(".grid-row").index());

                // ? ITEM DATA ROW-WISE
                const currentRowData = frm.fields_dict.items.grid.data[rowIndex];
                const currentRowProductCategory = currentRowData?.product_category;

                // ? IF NO CUSTOMER SELECTED
                if (!frm.doc.party || !frm.doc.opportunity_from) {
                    frappe.show_alert(__('Please Select a Customer First.'));
                    return;
                }

                // ? IF NO PRODUCT CATEGORY
                if (!currentRowProductCategory) {
                    return;
                }

                // ? CALL THE API TO FETCH PREVIOUS QUOTATION DATA
                frappe.call({
                    method: "prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.get_previous_tender_opportunity_data",
                    args: {
                        customer: frm.doc.party,
                        items: [currentRowProductCategory],
                    },
                    callback: function (res) {
                        // ? IF SUCCESS
                        if (res.message.success && res.message.data.length > 0) {

                            // ? GET DATA
                            const data = res.message.data;

                            // ? CREATE CONTENT FOR SUCCESS POPUP
                            const content = `
                            <div class="label" style="font-weight: bold;">Quotation History</div>
                            <hr style="margin:3px 0">
                            <table class="table table-bordered table-striped text-center w-100 m-0" style="margin-top:6px !important;">
                                <thead style="background-color: #f8f9fa; color: #343a40; font-weight: bold;">
                                    <tr>
                                        <th>Product Category</th>
                                        <th>Rate</th>
                                        <th>Tender Opportunity</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.map(item => `
                                        <tr style="padding: 4px !important; background-color: ${item.tender_opportunity === frm.doc.name ? '#d4edda' : 'transparent'};">
                                            <td style="padding: 4px !important;">${item.product_category}</td>
                                            <td style="padding: 4px !important;">${item.rate}</td>
                                            <td style="padding: 4px !important;"><a href="/app/tender-opportunity/${item.tender_opportunity}" target="_blank">${item.tender_opportunity}</a></td>
                                            <td style="padding: 4px !important;">${item.transaction_date}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            `;

                            // ? SHOW SUCCESS POPUP
                            createProductCategoryPopup(frm, parentElement, content);

                        } else {
                            // ? CREATE CONTENT FOR FAILURE POPUP
                            const content = `
                            <div class="label" style="font-weight: bold;">Quotations History</div>
                            <hr style="margin:3px 0">
                            <div style="padding: 40px 10px; text-align: center; color: #555;">There are no previous tender opportunity for this product category.</div>
                            `;

                            // ? SHOW FAILURE POPUP
                            createProductCategoryPopup(frm, parentElement, content);
                        }
                    }
                });
            }, 200);
        }
    );
}

// ? FUNCTION TO OPEN EMD FORM WITH TENDER OPPORTUNITY LINK FIELD SET
function createEMD(frm) {
    // ? IF FORM IS NOT SAVED DO NOT SHOW THE BUTTON
    if (!frm.doc.__islocal) {
        //? CHECH IF EMD REQUEST IS EXIST FOR TENDER OPPORTUNITY OR NOT
        frappe.call({
            method: 'envision_crm.envision_crm.api.controller.get_list_of_available_records',
            args: {
                doctype: 'EMD',
                filters: { tender_opportunity: frm.doc.name },
                fields: ['name'],
                limit_page_length: 1
            },
            callback: function (r) {
                if (r.message.length === 0) {
                    // ? ADD CUSTOM BUTTON FOR CREATE EMD IF THE EMD IS NOT AVAILABLE
                    frm.add_custom_button('EMD', function () {
                        // ? OPEN EMD FORM
                        frappe.model.with_doctype('EMD', function () {
                            var doc = frappe.model.get_new_doc('EMD');
                            doc.tender_opportunity = frm.doc.name;
                            doc.amount = frm.doc.emd_amount;
                            doc.customer = frm.doc.party;
                            doc.company = frm.doc.company;
                            doc.address = frm.doc.customer_address;
                            doc.tender_name = frm.doc.opportunity_name;

                            frappe.set_route('Form', 'EMD', doc.name);
                        });
                    }, 'Create');
                }
            }
        });
    }
}

// ? FUNCTION TO OPEN BANK GUARANTEE FORM WITH TENDER OPPORTUNITY LINK FIELD SET
function createPerformanceBankGuarantee(frm) {
    // ? IF FORM IS NOT SAVED DO NOT SHOW THE BUTTON
    if (!frm.doc.__islocal) {
        // ? CHECK IF BANK GUARANTEE EXISTS FOR QUOTATION OR NOT
        frappe.call({
            method: 'envision_crm.envision_crm.api.controller.get_list_of_available_records',
            args: {
                doctype: 'Bank Guarantee',
                filters: { custom_tender_opportunity: frm.doc.name},
                fields: ['name'],
                limit_page_length: 1
            },
            callback: function (r) {
                if (r.message.length === 0) {
                    // ? ADD CUSTOM BUTTON FOR CREATE PERFORMANCE BANK GUARANTEE
                    frm.add_custom_button('Performance Bank Guarantee', function () {
                        // ? OPEN BANK GUARANTEE FORM
                        frappe.model.with_doctype('Bank Guarantee', function () {
                            var doc = frappe.model.get_new_doc('Bank Guarantee');
                            doc.custom_tender_opportunity = frm.doc.name;
                            doc.custom_type = "Performance Guarantee";
                            doc.amount = frm.doc.estimated_amount;

                            frappe.set_route('Form', 'Bank Guarantee', doc.name);
                        });
                    }, 'Create');
                }
            }
        });
    }
}
