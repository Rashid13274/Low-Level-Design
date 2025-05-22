/*Step 1: Base62 Encoding (Strategy Pattern)
What is Base62?
A method to convert large numbers (like database IDs) into short strings using characters [a-zA-Z0-9].

Why Use It?
It generates shorter URLs than UUIDs or hashes (e.g., https://short.url/abc123). */

    class Base62Encoder {
        static ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        
        static encode(num) {
          if (num === 0) return this.ALPHABET[0];
          let encoded = '';
          while (num > 0) {
            encoded = this.ALPHABET[num % 62] + encoded;
            num = Math.floor(num / 62);
          }
          return encoded;
        }
      }

      module.exports = Base62Encoder;