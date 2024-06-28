$(document).ready(function(){
    $(document).on('click','#srch_btn',function(){
        let srch=$('#srch').val();

        if(srch === '' || !srch){
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please enter Emp Id !",
            });
        } else {
            $.ajax({
                method:'POST',
                url:'/dp_img_srch',
                data:{srch:srch},
                success: function(res) {
                    $('#thead').removeClass('d-none')
                    $('#tbody').empty();

                    if (res.duplicateImageDetails.length === 0) {
                        $('#thead').addClass('d-none')
                        Swal.fire({
                            icon: "info",
                            title: "No Data Found",
                            text: "No duplicate images found for the provided Emp Id.",
                        });
                    } else {
                        res.duplicateImageDetails.forEach(entry => {
                            var newRow = $('<tr>');

                            newRow.append($('<td>').text(entry.emp_id));
                            newRow.append($('<td>').text(entry.EMP_NAME));
                            if (entry.Event_Photo1 && entry.Event_Photo2 && entry.Event_Photo3) {
                                newRow.append($('<td>').text(entry.rc_id));
                            } else {
                                newRow.append($('<td>').text('No duplicates'));
                            }
                            if (entry.Event_Photo1 && entry.Event_Photo2 && entry.Event_Photo3) {
                                newRow.append($('<td>').text(entry.Event_Photo1 + ', ' + entry.Event_Photo2 + ', ' + entry.Event_Photo3));
                            } else {
                                newRow.append($('<td>').text('N/A'));
                            }
                            newRow.append($('<td>').text(entry.DateOfMeet));

                            $('#tbody').append(newRow);
                        });
                    }
                },
                error: function() {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "An error occurred while processing your request.",
                    });
                }
            });
        }
    });
});



$(document).on('click', '#reset', function () {
    window.location.reload()
  })