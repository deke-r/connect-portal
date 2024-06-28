$(document).ready(function () {
    $('#logout').click(function () {
        $.ajax({
            type: 'POST',
            url: '/logout',
            success: function (response) {
                window.location.href = response.redirect;

            },
            error: function (error) {
                console.error('Error:', error);
            }
        });
    });
});



