extern crate rug;
use rug::{Complex, Float};
use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;
use tungstenite::server::accept;
use tungstenite::protocol::Message;
use std::net::TcpListener;
extern crate serde;
extern crate serde_json;
use std::sync::{Arc, Mutex};


fn main() {
    let (tx_data, rx_data): (Sender<Vec<u8>>, Receiver<Vec<u8>>) = channel();
    
    let zoom_level = Arc::new(Mutex::new(1.0)); // Shared zoom level
    let zoom_level_clone = zoom_level.clone();
    
    // Calculation thread
    thread::spawn(move || {
        loop {
            let mut zoom_level_lock = zoom_level_clone.lock().unwrap();
            *zoom_level_lock += 0.001;
            let result = mandelbrot_calculation(*zoom_level_lock);
            tx_data.send(result).unwrap();
            // Consider adding a sleep here to pace the calculation
        }
    });

    // WebSocket server thread
    start_websocket_server(zoom_level, rx_data);
}

fn mandelbrot_calculation(zoom_level: f64) -> Vec<u8> {
    let max_iter: u32 = 1000;
    let precision = 64; // Adjust this based on zoom_level or other criteria
    let (x_min, x_max, y_min, y_max) = (-2.0, 1.0, -1.5, 1.5); // These could also be adjusted based on zoom level

    // Initialize variables
    let mut result: Vec<u8> = vec![];

    let x_step = Float::with_val(precision, (x_max - x_min) / zoom_level);
    let y_step = Float::with_val(precision, (y_max - y_min) / zoom_level);

    let mut y = Float::with_val(precision, y_min);
    while y < Float::with_val(precision, y_max) {
        let mut x = Float::with_val(precision, x_min);
        while x < Float::with_val(precision, x_max) {
            let c = Complex::with_val(precision, (x.clone(), y.clone()));
            let mut z = Complex::with_val(precision, (Float::with_val(precision, 0.0), Float::with_val(precision, 0.0)));
            let mut i = 0;

            while i < max_iter {
                let norm = z.clone().norm();  // Clone right before calling `norm`
                let real_part = norm.real().clone();
                let imag_part = norm.imag().clone();
                let norm_sqr = real_part.clone() * real_part + imag_part.clone() * imag_part;
            
                let (prec, _) = norm.prec();
                let four = Float::with_val(prec, 4.0);
            
                if norm_sqr > four {
                    break;
                }
                z = z.clone() * z + c.clone();
                i += 1;
            }
            

            let color = map_to_color(i, max_iter); // Implement this function to map iterations to colors
            result.push(color);
            x += &x_step;  // Manually increment x

        }
        y += &y_step;  // Manually increment y
    }

    result
}

fn map_to_color(iter: u32, max_iter: u32) -> u8 {
    // Example: map iteration count to grayscale
    ((iter as f64 / max_iter as f64) * 255.0) as u8
}

fn start_websocket_server(zoom_level: Arc<Mutex<f64>>, rx_data: Receiver<Vec<u8>>) {
    let server = TcpListener::bind("127.0.0.1:9001").unwrap();
    
    for stream in server.incoming() {
        let zoom_level_clone = zoom_level.clone();
        let rx_data_clone = rx_data.clone();
        
        thread::spawn(move || {
            let websocket_result = accept(stream.unwrap());
            
            if let Ok(mut websocket) = websocket_result {
                // Read initial zoom level from frontend once per connection
                let msg_result = websocket.read_message();
                if let Ok(msg) = msg_result {
                    if msg.is_text() || msg.is_binary() {
                        let initial_zoom_level: f64 = msg.to_string().parse().unwrap();
                        let mut zoom_level_lock = zoom_level_clone.lock().unwrap();
                        *zoom_level_lock = initial_zoom_level;
                    }
                }

                loop {
                    let data = rx_data_clone.recv().unwrap();
                    let message = serde_json::to_string(&data).unwrap();
                    websocket.write_message(Message::Text(message)).unwrap();
                }
            }
        });
    }
}
