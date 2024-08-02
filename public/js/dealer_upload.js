document.getElementById('upload_btn').addEventListener('click', function () {
    $('#loader-div').removeClass('d-none');

    var fileInput = document.getElementById('excel_upload');
    var saveExitBtn = document.getElementById('save_ext');

    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];

        if (file.name.endsWith('.csv')) {
            var reader = new FileReader();

            // Show the loader
            reader.onload = function (e) {
                var csvData = e.target.result;

                var rows = csvData.split('\n');

                var thead = document.getElementById('csvTableHead');
                var tbody = document.getElementById('csvTableBody');
                var csvTable = document.getElementById('csvTable');

                thead.innerHTML = '';
                tbody.innerHTML = '';

                var headerRow = thead.insertRow(0);
                var headers = rows[0].split(',');

                for (var i = 0; i < headers.length; i++) {
                    var th = document.createElement('th');
                    switch (headers[i].trim()) {
                        case 'Customer_Code':
                            th.textContent = "Customer Code";
                            break;
                        case 'Customer_Name':
                            th.textContent = "Customer Name";
                            break;
                        case 'Customer_Phone':
                            th.textContent = "Customer Phone";
                            break;
                        case 'Channel_Code':
                            th.textContent = "Channel Code";
                            break;
                        case 'Customer_Type':
                            th.textContent = "Customer Type";
                            break;
                        case 'City':
                            th.textContent = "City";
                            break;
                        case 'Contact_Person':
                            th.textContent = "Contact Person";
                            break;
                        default:
                            th.textContent = headers[i];
                            break;
                    }
                    headerRow.appendChild(th);
                }

                var fragment = document.createDocumentFragment();

                for (var j = 1; j < rows.length; j++) {
                    var rowData = rows[j].split(',');

                    if (rowData.length > 1) {
                        var row = document.createElement('tr');

                        for (var k = 0; k < headers.length; k++) {
                            var cell = document.createElement('td');
                            cell.textContent = rowData[k];
                            row.appendChild(cell);
                        }

                        fragment.appendChild(row);
                    }
                }

                tbody.appendChild(fragment);

                $('#loader-div').addClass('d-none');

                fileInput.setAttribute('disabled', 'true');
                saveExitBtn.removeAttribute('disabled');

                csvTable.classList.add('height_501');
            };

            reader.readAsText(file);
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please select a CSV file.",
                footer: '<a href="#">Why do I have this issue?</a>'
            });
            saveExitBtn.setAttribute('disabled', 'true');
        }
    } else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please select a file before clicking 'Upload'.",
            footer: '<a href="#">Why do I have this issue?</a>'
        });
        saveExitBtn.setAttribute('disabled', 'true');
    }
});



$(document).ready(function () {
    $(document).on('click', '#save_ext', function () {
        $('#loader-div').removeClass('d-none');

        var tableData = [];

        $('#csvTable').DataTable().$('tr', { 'filter': 'applied' }).each(function (index, tr) {
            var rowData = {
                "Customer_Code": $(tr).find('td:eq(0)').text().trim() || null,
                "Customer_Name": $(tr).find('td:eq(1)').text().trim() || null,
                "Customer_Phone": $(tr).find('td:eq(2)').text().trim() || null,
                "Channel_Code": $(tr).find('td:eq(3)').text().trim() || null,
                "Customer_Type": $(tr).find('td:eq(4)').text().trim() || null,
                "City": $(tr).find('td:eq(5)').text().trim() || null,
                "Contact_Person": $(tr).find('td:eq(6)').text().trim() || null
            };
            
            tableData.push(rowData);
        });

        $.ajax({
            type: 'POST',
            url: '/dealer_upload',
            data: { data: JSON.stringify(tableData) },
            success: function (response) {
                $('#loader-div').addClass('d-none');

                if (response.dup_data) {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Can't Upload duplicate Data!",
                    });
                } else {
                    Swal.fire({
                        title: "Good job!",
                        text: "Data Saved",
                        icon: "success",
                        confirmButtonText: "Exit",
                        footer: '<a href="/">Why do I have this issue?</a>'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "/super_admin_dashboard";
                        }
                    });
                }
            },
            error: function (error) {
                $('#loader-div').addClass('d-none')
                console.error("Error saving data:", error);
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "An error occurred while saving data.",
                    footer: '<a href="#">Why do I have this issue?</a>'
                });
            }
        });
    });
});


$(document).on('click', '#reset', function () {
    window.location.reload()
  })