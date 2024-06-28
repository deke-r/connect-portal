$(document).ready(function () {

    function updateCount() {
        // Mobile number count
        var count = $('#txt_no option').length;
        $('#options_count').text('Attended Count: [ ' + count + ' ]');
        $('#countInput').val(count);

        // ADE count
        var countade = $('#txt_noade option').length;
        $('#options_countade').text('ADE Employee Attended Count: [ ' + countade + ' ]');
        $('#countInputade').val(countade);

        // EMP Count
        var countemp = $('#txt_noemp option').length;
        $('#options_countemp').text('JACPL Employee Attended Count: [ ' + countemp + ' ]');
        $('#countInputemp').val(countemp);

        //  limit 15 condition swal
        if (count >= 15 && count <= 15) {
            Swal.fire({
                icon: "error",
                title: "",
                html: `<h5 class='fw-600'>Press "YES": More than 15 contractors can be entered & approval will go to respective BM/ASM.</h5><br>
                <h5 class='fw-600'>Press "NO": Maximum 15 contractors can be entered & BTL will be automatically approved.</h5>
                `,
                showCancelButton: true,
                confirmButtonText: 'YES',
                cancelButtonText: 'NO'
            }).then((result) => {
                if (result.isConfirmed) {
                    $('#email_to_send').val('Yes')
                } else {
                    $('#email_to_send').val('No')
                    $('#int_no').prop('disabled', true);
                    $('#btn_add').prop('disabled', true);

                }
            });
        }

        updateTextArea();
        updateTextAreaemp();
        updateTextAreaade();
        updateTotal(); // Update the total count multiplication
    }

    $(document).on('click', '#btn_add', function () {
        var mySelectVal = $('#mySelect').val(); 
        if (mySelectVal !== null && mySelectVal !== '') { 
            var no = $('#int_no').val().trim();
            if (no !== "") {
                if (/^\d{10}$/.test(no)) {
                    if ($('#txt_no option[value="' + no + '"]').length === 0) {
                        $('#txt_no').append(`<option value="${no}" selected class='selected'>${no}</option>`);
                        $('#int_no').val('');
                        updateCount();
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            html: "<h4 class='fw-600'>This number is already added!</h4>",
                            preConfirm: function () { }
                        });
                    }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        html: "<h4 class='fw-600'>Please enter a valid 10-digit phone number!</h4>",
                        preConfirm: function () { }
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    html: "<h4 class='fw-600'>Please enter a phone number!</h4>",
                    preConfirm: function () { }
                });
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                html: "<h4 class='fw-600'>Please select any option from Meeting Gift Details!</h4>",
                preConfirm: function () { }
            });
        }
    });

    $(document).on('click', '#btn_addade', function () {
        var mySelectVal = $('#mySelect').val(); 
        if (mySelectVal !== null && mySelectVal !== '') { 
            var no = $('#int_noade').val().trim();
            if (no !== "") {
                if (!no.startsWith("16")) {
                    $.ajax({
                        method: 'POST',
                        url: '/jeaAPIhitsga',
                        data: { no: no },
                        success: function (res) {
                            let num1 = res.emppid;
                            let numA = res.empnamee;
                            if (num1 && numA) {
                                let optionValue = num1 + ":" + numA;
                                if ($('#txt_noade option[value="' + optionValue + '"]').length === 0) {
                                    $('#txt_noade').append(`<option value="${optionValue}" selected class='selected'>${optionValue}</option>`);
                                    $('#int_noade').val('');
                                    updateCount();
                                } else {
                                    Swal.fire({
                                        icon: "error",
                                        title: "Oops...",
                                        html: "<h4 class='fw-600'>This ADE Id is already added!</h4>",
                                        preConfirm: function () { }
                                    });
                                }
                            } else {
                                Swal.fire({
                                    icon: "error",
                                    title: "Oops...",
                                    html: "<h4 class='fw-600'>ADE not found!</h4>",
                                    preConfirm: function () { }
                                });
                            }
                        },
                        error: function (error) {
                            console.error(error);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                html: "<h4 class='fw-600'>Error occurred while adding the ADE Id!</h4>",
                                preConfirm: function () { }
                            });
                        }
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        html: "<h4 class='fw-600'>ADE Id should not start with '16'!</h4>",
                        preConfirm: function () { }
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    html: "<h4 class='fw-600'>Please enter a ADE Id!</h4>",
                    preConfirm: function () { }
                });
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                html: "<h4 class='fw-600'>Please select any option from Meeting Gift Details!</h4>",
                preConfirm: function () { }
            });
        }
    });
    



    $(document).on('click', '#btn_addemp', function () {
        var mySelectVal = $('#mySelect').val(); 
        if (mySelectVal !== null && mySelectVal !== '') { 
            var no = $('#int_noemp').val().trim();
            if (no !== "") {
                if (no.startsWith("16")) {
                    $.ajax({
                        method: 'POST',
                        url: '/jeaAPIhitsga',
                        data: { no: no },
                        success: function (res) {
                            let num1 = res.emppid;
                            let numA = res.empnamee;
                            if (num1 && numA) {
                                let empId = num1 + ":" + numA;
                                if ($('#txt_noemp option[value="' + empId + '"]').length === 0) {
                                    $('#txt_noemp').append(`<option value="${empId}" selected class='selected'>${empId}</option>`);
                                    $('#int_noemp').val('');
                                    updateCount();
                                } else {
                                    Swal.fire({
                                        icon: "error",
                                        title: "Oops...",
                                        html: "<h4 class='fw-600'>This Employee Id is already added!</h4>",
                                        preConfirm: function () { }
                                    });
                                }
                            } else {
                                Swal.fire({
                                    icon: "error",
                                    title: "Oops...",
                                    html: "<h4 class='fw-600'>Employee not found!</h4>",
                                    preConfirm: function () { }
                                });
                            }
                        },
                        error: function (error) {
                            console.error(error);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                html: "<h4 class='fw-600'>Error occurred while adding EMP Id!</h4>",
                                preConfirm: function () { }
                            });
                        }
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        html: "<h4 class='fw-600'>Employee ID should start with '16'!</h4>",
                        preConfirm: function () { }
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    html: "<h4 class='fw-600'>Please enter a Employee Id!</h4>",
                    preConfirm: function () { }
                });
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                html: "<h4 class='fw-600'>Please select any option from Meeting Gift Details!</h4>",
                preConfirm: function () { }
            });
        }
    });




    $(document).on('click', '#del_txt_no', function () {
        $('#txt_no option:selected').remove();
        updateCount();
    });

    $(document).on('click', '#del_txt_noemp', function () {
        $('#txt_noemp option:selected').remove();
        updateCount();
    });

    $(document).on('click', '#del_txt_noade', function () {
        $('#txt_noade option:selected').remove();
        updateCount();
    });

    $(document).on('change', '#imageInput', function () {
        imageUploaded = true;
        $('#btn_add').prop('disabled', false);
        updateCount();
    });

    function getDropdownValues() {
        var dropdownValues = [];
        $('#txt_no option').each(function () {
            dropdownValues.push($(this).val());
        });
        return dropdownValues.join(',');
    }

    function updateTextArea() {
        var allOptionValues = getDropdownValues();
        $('#gt').val(allOptionValues);
    }

    function getDropdownValuesemp() {
        var dropdownValuesemp = [];
        $('#txt_noemp option').each(function () {
            dropdownValuesemp.push($(this).val());
        });
        return dropdownValuesemp.join(',');
    }

    function updateTextAreaemp() {
        var allOptionValuesemp = getDropdownValuesemp();
        $('#gtemp').val(allOptionValuesemp);
    }

    function getDropdownValuesade() {
        var dropdownValuesade = [];
        $('#txt_noade option').each(function () {
            dropdownValuesade.push($(this).val());
        });
        return dropdownValuesade.join(',');
    }

    function updateTextAreaade() {
        var allOptionValuesade = getDropdownValuesade();
        $('#gtade').val(allOptionValuesade);
    }

    function updateTotal() {
        let cal = 0;
        let cal2 = 0;
        let cal3 = 0;

        let id1 = parseFloat(document.getElementById("fiLE_SETTING_VALUE").value);
        let count1 = parseFloat($('#countInput').val());
        cal = count1 * id1;

        let id2 = parseFloat(document.getElementById("fiLE_SETTING_VALUEADE").value);
        let count2 = parseFloat($('#countInputade').val());
        cal2 = count2 * id2;

        let id3 = parseFloat(document.getElementById("fiLE_SETTING_VALUEEMP").value);
        let count3 = parseFloat($('#countInputemp').val());
        cal3 = count3 * id3;

        let total = cal + cal2 + cal3;
        $('#valuetotal').text('Budget For The Meet Rs:- [ ' + cal3 + ' ] + [ ' + cal2 + ' ] + [ ' + cal + ' ]');
        $('#total').val(total);
        $('#cal').val(total);

        $('#cal1').val(cal)
        $('#cal2').val(cal2)
        $('#cal3').val(cal3)
    }

    $(document).on('click', '.add', function () {
        updateTotal();
    });

    $(document).on('click', '.addade', function () {
        updateTotal();
    });

    $(document).on('click', '.addemp', function () {
        updateTotal();
    });

    updateCount();
});

$(document).ready(function () {
    $(document).on('click', '#back', function () {
        window.history.back()
    });
});

$(function () {
    $("#datepicker").datepicker({
        minDate: -7,
        maxDate: "+1D",
        dateFormat: 'dd-mm-yy'
    });
});

$(document).ready(function () {
    $(document).on('change', '.onchange', function () {

        var selectElement = document.getElementById("mySelect");
        var selectedOption = selectElement.options[selectElement.selectedIndex];

        var dataIdValue = selectedOption.getAttribute('data-id');
        var dataIdValueade = selectedOption.getAttribute('data-food');
        var dataIdValueemp = selectedOption.getAttribute('data-food');

        document.getElementById("fiLE_SETTING_VALUE").value = `${dataIdValue}`;
        document.getElementById("fiLE_SETTING_VALUEADE").value = `${dataIdValueade}`;
        document.getElementById("fiLE_SETTING_VALUEEMP").value = `${dataIdValueemp}`;

    });
});

$(document).ready(function () {
    $(document).on('click', '.submitExpense', function (event) {
        var budget = parseFloat(document.getElementById('total').value);
        var expense = parseFloat(document.getElementsByName('expense')[0].value);

        if (expense > budget) {
            alert('Expense cannot be greater than the budget!');
            event.preventDefault();
        } else { }
    });
});

$(document).ready(function () {
    $('form').submit(function (event) {
        $('#dealer_code').prop('disabled', false)
        $('#dd_firm_name').prop('disabled', false)
        $('#dealername').prop('disabled', false)
        $('#dd_mobilenumber').prop('disabled', false)
        $('#dd_city').prop('disabled', false)
        $('#loader-div').removeClass('d-none')

        event.preventDefault();
        var formData = new FormData($(this)[0]);

        $.ajax({
            type: 'POST',
            url: '/in-shope',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                
                $('#loader-div').addClass('d-none')

                console.log(response.message);
                Swal.fire({
                    title: 'Success!',
                    text: response.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload();
                    }
                });
            },
            error: function (error) {
                $('#loader-div').addClass('d-none')

                console.log(error.error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'An error occurred while processing your request.',
                    footer: '<a href="#">Why do I have this issue?</a>'
                });
            }
        });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    const inputs = document.querySelectorAll('input[type="file"]');

    inputs.forEach(input => {
        input.addEventListener('change', function () {
            const selectedFile = this.files[0];
            const fileNames = Array.from(inputs).map(input => input.files[0]?.name);
            const fileName = selectedFile.name;

            if (fileNames.filter(name => name === fileName).length > 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'You cannot upload the same image to multiple fields.',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
                this.value = ''; 
            }
        });
    });
});


$(document).ready(function () {
    $(document).on('click', '#check_dd', function () {
        var dealer_code = $('#dealer_code').val();

        if (dealer_code === '' || !dealer_code) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please enter a dealer code!',
            });
        } else {
            $.ajax({
                method: 'POST',
                url: '/dealer_check_inshop',
                data: ({ dealer_code: dealer_code }),
                success: function (res) {
                    if (res.data.length == 0) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Dealer code does not exist!',
                        });
                    } else {
                        console.log(res.data);

                        $('#dealer_code').prop('disabled', true);
                        $('#check_dd').prop('disabled', true);


                        $('#dd_firm_name').val(res.data[0].Customer_Name);
                        $('#dealername').val(res.data[0].Contact_Person)
                        $('#dd_mobilenumber').val(res.data[0].Customer_Phone)
                        $('#dd_city').val(res.data[0].City)

                        $('#dd_firm_name').prop('disabled', res.data[0].Customer_Name !== null && res.data[0].Customer_Name !== '');
                        $('#dealername').prop('disabled', res.data[0].Contact_Person !== null && res.data[0].Contact_Person !== '');
                        $('#dd_mobilenumber').prop('disabled', res.data[0].Customer_Phone !== null && res.data[0].Customer_Phone !== '');
                        $('#dd_city').prop('disabled', res.data[0].City !== null && res.data[0].City !== '');

                    }
                }
            });
        }
    });
});





$(document).on('click', '#reset_dd', function () {
    $('#dealer_code').val('')
    $('#dd_firm_name').val('')
    $('#dealername').val('')
    $('#dd_mobilenumber').val('')
    $('#dd_city').val('')

    $('#check_dd').prop('disabled', false);
    $('#dealer_code').prop('disabled', false)
    $('#dd_firm_name').prop('disabled', false)
    $('#dealername').prop('disabled', false)
    $('#dd_mobilenumber').prop('disabled', false)
    $('#dd_city').prop('disabled', false)
})







$(document).ready(function() {
    $('#mySelect').on('change', function() {
        var ady = $('#ady').val()
        var isRequired = $(this).val() === ady;
        $('#rqr_att').prop('required', isRequired);
        if (isRequired) {
            $('#mandatory').text('(Mandatory)');
        } else {
            $('#mandatory').text('');
        }
    });
});
