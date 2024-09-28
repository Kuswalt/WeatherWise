<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "./modules/post.php";
require_once __DIR__ . '/require.php';

// Initialize Get and Post objects
$post = new Post();

// Check if 'request' parameter is set in the request
if (isset($_REQUEST['request'])) {
    $request = explode('/', $_REQUEST['request']);
} else {
    echo "Not Found";
    http_response_code(404);
}

// Handle requests based on HTTP method
switch ($_SERVER['REQUEST_METHOD']) {

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {
            case 'search-city':
                echo json_encode($post->searchByCity($data));
                break;
            case 'search-location':
                echo json_encode($post->searchByLocation($data));
                break;
            case 'reverse-geocode-location':
                echo json_encode($post->reverseGeocodeLocation($data));
                break;
            case 'geocode-city':
                echo json_encode($post->reverseGeocodeCity($data));
                break;
            case 'get-five-day-forecast':
                echo json_encode($post->getFiveDayForecast($data));
                break;
            default:
                echo "No Such Request";
                http_response_code(403);
                break;
        }
        break;

    default:
        echo "Unsupported HTTP method";
        http_response_code(404);
        break;
}