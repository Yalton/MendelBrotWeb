extern crate rug;
use rug::{Complex, Float};
use std::net::SocketAddr;
use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;
use tungstenite::server::accept;
use tungstenite::protocol::Message;
use std::net::TcpListener;

fn main() {
    let (tx, rx): (Sender<f64>, Receiver<f64>) = channel();
    
    // Spawn a thread to perform the Mandelbrot calculation
    let tx_clone = tx.clone();
    thread::spawn(move || {
        loop {
            let zoom_level = rx.recv().unwrap();
            let result = mandelbrot_calculation(zoom_level);

            // For demonstration, just sending the same zoom level back
            tx_clone.send(zoom_level).unwrap();
        }
    });
    
    start_websocket_server(tx);
}

fn mandelbrot_calculation(zoom_level: f64) -> Vec<u8> {
    let max_iter: u32 = 1000;
    let precision = 64; // Adjust this based on zoom_level or other criteria
    let (x_min, x_max, y_min, y_max) = (-2.0, 1.0, -1.5, 1.5); // These could also be adjusted based on zoom level

    // Initialize variables
    let mut result: Vec<u8> = vec![];

    let x_step = Float::with_val(precision, (x_max - x_min) / zoom_level);
    let y_step = Float::with_val(precision, (y_max - y_min) / zoom_level);

    for y in (Float::with_val(precision, y_min)..Float::with_val(precision, y_max)).step_by(y_step.clone()) {
        for x in (Float::with_val(precision, x_min)..Float::with_val(precision, x_max)).step_by(x_step.clone()) {
            let c = Complex::with_val(precision, (x.clone(), y.clone()));
            let mut z = Complex::with_val(precision, (Float::with_val(precision, 0), Float::with_val(precision, 0)));
            let mut i = 0;

            while i < max_iter {
                if z.norm_sqr().to_f64() > 4.0 {
                    break;
                }
                z = &z * &z + &c;
                i += 1;
            }

            let color = map_to_color(i, max_iter); // Implement this function to map iterations to colors
            result.push(color);
        }
    }

    result
}

fn map_to_color(iter: u32, max_iter: u32) -> u8 {
    // Example: map iteration count to grayscale
    ((iter as f64 / max_iter as f64) * 255.0) as u8
}

fn start_websocket_server(tx: Sender<f64>) {
    let server = TcpListener::bind("127.0.0.1:9001").unwrap();
    for stream in server.incoming() {
        thread::spawn(move || {
            let mut websocket = accept(stream.unwrap()).unwrap();
            
            loop {
                let msg = websocket.read_message().unwrap();
                
                if msg.is_text() || msg.is_binary() {
                    // Assume message is zoom level; convert it to f64
                    let zoom_level: f64 = msg.to_string().parse().unwrap();
                    
                    // Send it to the Mandelbrot calculation thread
                    tx.send(zoom_level).unwrap();
                    
                    // This is where you would usually send back the real calculation result
                    let reply = Message::Text("Data from backend".to_string());
                    websocket.write_message(reply).unwrap();
                }
            }
        });
    }
}
