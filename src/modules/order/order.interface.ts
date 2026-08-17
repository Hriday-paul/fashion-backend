export interface IShipment {
    "shipment": {
        "easyship_shipment_id": "ESSG10006002",
        "buyer_regulatory_identifiers": {
            "ein": null,
            "ssn": null,
            "vat_number": null
        },
        "consignee_tax_id": null,
        "courier_service": {
            "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
            "courier_id": "01563646-58c1-4607-8fe0-cae3e33c0001",
            "easyship_courier_service": true,
            "name": "Courier 1",
            "umbrella_name": "DHL"
        },
        "created_at": "2022-02-22T12:21:00Z",
        "currency": "HKD",
        "delivery_state": "not_created",
        "destination_address": {
            "city": "Hong Kong",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+85230085678",
            "country_alpha2": "HK",
            "delivery_instructions": null,
            "line_1": "Kennedy Town",
            "line_2": "Block 3",
            "postal_code": "0000",
            "state": "Yuen Long"
        },
        "eei_reference": null,
        "incoterms": "DDU",
        "insurance": {
            "is_insured": false,
            "insured_amount": 0,
            "insured_currency": "HKD"
        },
        "label_generated_at": null,
        "label_paid_at": "2022-02-22T12:21:00Z",
        "label_state": "failed",
        "last_failure_http_response_messages": [],
        "metadata": {},
        "order_data": {
            "buyer_notes": null,
            "buyer_selected_courier_name": null,
            "order_created_at": null,
            "order_tag_list": [],
            "platform_name": null,
            "platform_order_number": null,
            "seller_notes": null
        },
        "origin_address": {
            "city": "Hong Kong",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-3008-5678",
            "country_alpha2": "HK",
            "line_1": "Kennedy Town",
            "line_2": "Block 3",
            "postal_code": "0000",
            "state": "Yuen Long"
        },
        "parcels": [
            {
                "box": {
                    "id": null,
                    "name": null,
                    "outer_dimensions": {
                        "length": 3,
                        "width": 2,
                        "height": 2
                    },
                    "slug": null,
                    "type": "box",
                    "weight": 0
                },
                "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
                "items": [
                    {
                        "actual_weight": 10,
                        "category": null,
                        "contains_battery_pi966": true,
                        "contains_battery_pi967": true,
                        "contains_liquids": true,
                        "declared_currency": "USD",
                        "declared_customs_value": 20,
                        "description": "item",
                        "dimensions": {
                            "length": 1,
                            "width": 2,
                            "height": 3
                        },
                        "hs_code": "12345600",
                        "id": "12663646-58c1-4607-8fe0-cae3e33c0001",
                        "origin_country_alpha2": "HK",
                        "origin_currency": "HKD",
                        "origin_customs_value": 140,
                        "quantity": 2,
                        "sku": "sku"
                    }
                ],
                "total_actual_weight": 1,
                "tracking_number": null
            }
        ],
        "pickup_state": "not_requested",
        "rates": [
            {
                "additional_services_surcharge": 0,
                "available_handover_options": [
                    "dropoff",
                    "free_pickup"
                ],
                "cost_rank": 2,
                "courier_remarks": null,
                "courier_service": {
                    "courier_id": "01563646-58c1-4607-8fe0-cae3e33c0001",
                    "easyship_courier_service": true,
                    "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
                    "logo": null,
                    "name": "Courier 1",
                    "umbrella_name": "DHL"
                },
                "currency": "USD",
                "ddp_handling_fee": 0,
                "delivery_time_rank": 4,
                "description": "description",
                "discount": null,
                "easyship_rating": 2,
                "estimated_import_duty": 0,
                "estimated_import_tax": 65.96,
                "fuel_surcharge": 10,
                "full_description": "full description",
                "import_duty_charge": 0,
                "import_duty_details": null,
                "import_tax_charge": 0,
                "import_tax_non_chargeable": 0,
                "incoterms": "DDU",
                "insurance_fee": 0,
                "is_above_duty_threshold": null,
                "is_above_threshold": true,
                "max_delivery_time": 39,
                "min_delivery_time": 19,
                "minimum_pickup_fee": 0,
                "other_surcharges": {
                    "details": [
                        {
                            "fee": 0,
                            "name": "Peak Surcharge",
                            "origin_fee": 0
                        }
                    ],
                    "total_fee": 0
                },
                "oversized_surcharge": 0,
                "payment_recipient": "Easyship",
                "provincial_sales_tax": 0,
                "rates_in_origin_currency": {
                    "additional_services_surcharge": 0,
                    "currency": "HKD",
                    "ddp_handling_fee": 0,
                    "estimated_import_duty": 0,
                    "estimated_import_tax": 65.96,
                    "fuel_surcharge": 1400,
                    "import_duty_charge": 0,
                    "import_tax_charge": 0,
                    "import_tax_non_chargeable": 0,
                    "insurance_fee": 0,
                    "minimum_pickup_fee": 0,
                    "oversized_surcharge": 0,
                    "provincial_sales_tax": 0,
                    "remote_area_surcharge": 0,
                    "residential_discounted_fee": 0,
                    "residential_full_fee": 0,
                    "sales_tax": 0,
                    "shipment_charge": 140,
                    "shipment_charge_total": 1540,
                    "total_charge": 1540,
                    "warehouse_handling_fee": 0
                },
                "remote_area_surcharge": 0,
                "remote_area_surcharges": null,
                "residential_discounted_fee": 0,
                "residential_full_fee": 0,
                "sales_tax": 0,
                "shipment_charge": 100,
                "shipment_charge_total": 110,
                "total_charge": 110,
                "tracking_rating": 2,
                "value_for_money_rank": 4,
                "warehouse_handling_fee": 0
            }
        ],
        "regulatory_identifiers": {
            "eori": null,
            "ioss": null,
            "vat_number": null
        },
        "return": false,
        "return_address": {
            "city": "Hong Kong",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-3008-5678",
            "country_alpha2": "HK",
            "line_1": "Kennedy Town",
            "line_2": "Block 3",
            "postal_code": "0000",
            "state": "Yuen Long"
        },
        "sender_address": {
            "city": "Hong Kong",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-3008-5678",
            "country_alpha2": "HK",
            "line_1": "Kennedy Town",
            "line_2": "Block 3",
            "postal_code": "0000",
            "state": "Yuen Long"
        },
        "set_as_residential": false,
        "shipment_state": "created",
        "shipping_documents": [],
        "shipping_settings": {
            "b13a_filing": null,
            "label_customization_fields": []
        },
        "tracking_page_url": "http://api.easyship.com:9003/shipment-tracking/ESSG10006002",
        "trackings": [],
        "updated_at": "2022-02-22T12:21:00Z",
        "warehouse_state": "none"
    },
    "meta": {
        "errors": [
            "Generate label action 'generate_label' is not available for Courier 1_SG API"
        ],
        "request_id": "01563646-58c1-4607-8fe0-cae3e92c4477",
        "status": "partial_success",
        "unavailable_couriers": []
    }
}

export interface ILabel {
    "shipment": {
        "easyship_shipment_id": "ESSG10006001",
        "buyer_regulatory_identifiers": {
            "ein": null,
            "ssn": null,
            "vat_number": null
        },
        "consignee_tax_id": null,
        "courier_service": {
            "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
            "courier_id": "01563646-58c1-4607-8fe0-cae3e33c0001",
            "easyship_courier_service": true,
            "name": "FedEx Economy HK",
            "umbrella_name": "FedEx"
        },
        "created_at": "2022-02-22T12:21:00Z",
        "currency": "HKD",
        "delivery_state": "not_created",
        "destination_address": {
            "city": "SINGAPORE",
            "company_name": null,
            "contact_email": "test@test.com",
            "contact_name": "Test McTest",
            "contact_phone": "+6512345678",
            "country_alpha2": "SG",
            "delivery_instructions": "Beware of the dog",
            "line_1": "Orchard Road 5th",
            "line_2": null,
            "postal_code": "546080",
            "state": "SINGAPORE"
        },
        "eei_reference": null,
        "incoterms": "DDU",
        "insurance": {
            "is_insured": true,
            "insured_amount": 10,
            "insured_currency": "HKD"
        },
        "label_generated_at": null,
        "label_paid_at": "2022-02-22T12:21:00Z",
        "label_state": "failed",
        "last_failure_http_response_messages": [],
        "metadata": {},
        "order_data": {
            "buyer_notes": null,
            "buyer_selected_courier_name": null,
            "order_created_at": null,
            "order_tag_list": [],
            "platform_name": null,
            "platform_order_number": null,
            "seller_notes": null
        },
        "origin_address": {
            "city": "City",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-1234-5678",
            "country_alpha2": "HK",
            "line_1": "123 Test Street",
            "line_2": "Block 3",
            "postal_code": "ABC123",
            "state": "State"
        },
        "parcels": [
            {
                "box": {
                    "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
                    "name": "small_box",
                    "outer_dimensions": {
                        "length": 15,
                        "width": 7,
                        "height": 25
                    },
                    "slug": "small_box",
                    "type": "box",
                    "weight": 3
                },
                "id": "01563646-58c1-4607-8fe0-cae3e33c0001",
                "items": [
                    {
                        "actual_weight": 2,
                        "category": "Mobile Phones",
                        "contains_battery_pi966": false,
                        "contains_battery_pi967": true,
                        "contains_liquids": false,
                        "declared_currency": "HKD",
                        "declared_customs_value": 100,
                        "description": "Testing Testing",
                        "dimensions": {
                            "length": 10,
                            "width": 10,
                            "height": 10
                        },
                        "hs_code": null,
                        "id": "01563646-58c1-4607-8fe0-cae3e33c0000",
                        "origin_country_alpha2": null,
                        "origin_currency": "HKD",
                        "origin_customs_value": 100,
                        "quantity": 1,
                        "sku": "12341234"
                    }, 
                ],
                "total_actual_weight": 30
            }
        ],
        "pickup_state": "not_requested",
        "rates": [],
        "regulatory_identifiers": {
            "eori": null,
            "ioss": null,
            "vat_number": null
        },
        "return": false,
        "return_address": {
            "city": "City",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-1234-5678",
            "country_alpha2": "HK",
            "line_1": "123 Test Street",
            "line_2": "Block 3",
            "postal_code": "ABC123",
            "state": "State"
        },
        "sender_address": {
            "city": "City",
            "company_name": "Test Plc.",
            "contact_email": "asd@asd.com",
            "contact_name": "Foo Bar",
            "contact_phone": "+852-1234-5678",
            "country_alpha2": "HK",
            "line_1": "123 Test Street",
            "line_2": "Block 3",
            "postal_code": "ABC123",
            "state": "State"
        },
        "set_as_residential": false,
        "shipment_state": "created",
        "shipping_documents": [
            {
                "base64_encoded_strings": [
                    "JVBERi0xLjUKJf//////AAAAAAoxI"
                ],
                "category": "label",
                "format": "pdf",
                "page_size": "a4",
                "required": true,
                "url": string | null
            },
            {
                "base64_encoded_strings": [""],
                "category": "battery_form",
                "format": "pdf",
                "page_size": "a4",
                "required": true,
                "url": string | null
            }
        ],
        "shipping_settings": {
            "b13a_filing": null,
            "label_customization_fields": []
        },
        "tracking_page_url": "http://api.easyship.com:9003/shipment-tracking/ESSG10006001",
        "trackings": [
            {
                "tracking_number" : string,
                "alternate_tracking_number": string | null,
            }
        ],
        "updated_at": "2022-02-22T12:21:00Z",
        "warehouse_state": "none"
    },
    "examples": {
        "label_successfully_created": {
            "summary": "label successfully created",
            "value": {
                "printing_options": {
                    "format": "pdf",
                    "label": "A4"
                }
            }
        }
    },
    "meta": {
        "request_id": "01563646-58c1-4607-8fe0-cae3e92c4477",
        "unavailable_couriers": []
    }
}