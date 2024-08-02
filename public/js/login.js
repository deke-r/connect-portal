
$(document).on('click', '#defaultCheck1', function () {
    var x = document.getElementById("passInput");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
   
})





$(document).ready(function () {
    $('form').submit(function (event) {
        event.preventDefault();
        var formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/login',
            data: formData,
            success: function (data) {
                if (data.usernameError) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.usernameError
                    });
                } else if (data.passwordError) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.passwordError
                    });
                } else if (data.redirect) {
                    window.location.href = data.redirect;
                }
            },
            error: function (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Invalid Username or Password'
                });
            }
        });
    });
});









