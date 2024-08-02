

$(document).ready(function() {
    $('.rcid').click(function() {
        var rc_id = $(this).data('rc_id');

        $.ajax({
            url: '/expance_approved',
            type: 'POST', 
            data: { rc_id: rc_id },
            success: function(res) {
                if(res === 'success') {
                    
                    Swal.fire({
                        title: `Successful Approved Your RC ID ${rc_id}`,
                        icon: 'success',
                        text: 'Success',
                    }).then(function() {
                        location.reload();
                    });
                } else {
                   
                    Swal.fire({
                        title: 'Error',
                        icon: 'error',
                        text: 'Error',
                    });
                }
            },
            error: function(err) {
              
                Swal.fire({
                    title: 'Error',
                    icon: 'error',
                    text: 'An error occurred while processing your request.',
                });
            }
        });
    });
});







$(document).ready(function() {
    $('.rcid_reject').click(function() {
        
        var rc_id = $(this).data('rc_id');
        alert(rc_id)
        $.ajax({
            url: '/expance_reject', 
            type: 'POST', 
           data: { rc_id: rc_id },
           success: function(res) {
            if(res === 'success') {
                
                Swal.fire({
                    title: `Successful Rejected Your RC ID ${rc_id}`,
                    icon: 'success',
                    text: 'Success',
                }).then(function() {
                    location.reload();
                });
            } else {
               
                Swal.fire({
                    title: 'Error',
                    icon: 'error',
                    text: 'Error',
                });
            }
        },
        error: function(err) {
          
            Swal.fire({
                title: 'Error',
                icon: 'error',
                text: 'An error occurred while processing your request.',
            });
        }
        });
    });
});




