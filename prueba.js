const jsftp = require("jsftp");
var Fs = require("fs");

    const ftp = new jsftp({
        host: "ftp.mentopoker.com",
        port: 21, // defaults to 21
        user: "mentobot@mentopoker.com", // defaults to "anonymous"
        pass: "]1i1qm@3h#^#" // defaults to "@anonymous"
      });

      ftp.auth("mentobot@mentopoker.com", "]1i1qm@3h#^#", (err, data) => {

        Fs.readFile("mano.png", "binary", function(err, data) {
            
            var buffer = new Buffer(data, "binary");
            ftp.put(buffer, "/mentopoker.com/public_html/wp-content/uploads/2022/08/mano.png", err => {
             
    
              
    
              
            });
        });

       
        
      });

     

   





