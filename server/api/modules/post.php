<?php

class Post
{
    private $openWeatherKey;

    public function __construct()
    {
        $this->openWeatherKey = $_ENV['API_KEY'];
    }

    public function sendPayload($data, $remarks, $message, $code)
    {
        $status = array("remarks" => $remarks, "message" => $message);
        http_response_code($code);
        return array(
            "status" => $status,
            "payload" => $data,
        );
    }

    public function searchByCity($data)
    {
        $validMetricSystems = ['&units=standard', '&units=metric', '&units=imperial'];
        if (!in_array($data->metricSystem, $validMetricSystems)) {
            return $this->sendPayload(null, "failed", "Invalid metric system..", 400);
        }
        if (!isset($data->city) || empty($data->city)) {
            return $this->sendPayload(null, "failed", "Please Enter a City.", 400);
        }

        $city = urlencode($data->city);
        $metricSystem = $data->metricSystem;
        $api_key = $this->openWeatherKey;
        $weatherApi = "https://api.openweathermap.org/data/2.5/weather?q=$city&appid=$api_key&$metricSystem";
        $forecastApi = "https://api.openweathermap.org/data/2.5/forecast?q=$city&appid=$api_key&$metricSystem";

        // Fetch current weather data
        $weatherResult = $this->fetchApiData($weatherApi);
        if ($weatherResult['status'] !== 200) {
            return $this->sendPayload(null, "failed", $weatherResult['message'], $weatherResult['status']);
        }

        // Fetch forecast data
        $forecastResult = $this->fetchApiData($forecastApi);
        if ($forecastResult['status'] !== 200) {
            return $this->sendPayload(null, "failed", $forecastResult['message'], $forecastResult['status']);
        }

        // Combine results
        $resultArray = [
            'current' => $weatherResult['data'],
            'forecast' => $forecastResult['data']
        ];

        return $this->sendPayload($resultArray, "success", "Request Success!", 200);
    }

    public function searchByLocation($data)
    {
        $validMetricSystems = ['&units=standard', '&units=metric', '&units=imperial'];
        if (!in_array($data->metricSystem, $validMetricSystems)) {
            return $this->sendPayload(null, "failed", "Invalid metric system..", 400);
        }
        if (!isset($data->lat) || !isset($data->lon)) {
            return $this->sendPayload(null, "failed", "Please enter a Location.", 400);
        }

        $lat = $data->lat;
        $lon = $data->lon;
        $metricSystem = $data->metricSystem;
        $api_key = $this->openWeatherKey;
        $weatherApi = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&appid=$api_key&$metricSystem";
        $forecastApi = "https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lon&appid=$api_key&$metricSystem";

        // Fetch current weather data
        $weatherResult = $this->fetchApiData($weatherApi);
        if ($weatherResult['status'] !== 200) {
            return $this->sendPayload(null, "failed", $weatherResult['message'], $weatherResult['status']);
        }

        // Fetch forecast data
        $forecastResult = $this->fetchApiData($forecastApi);
        if ($forecastResult['status'] !== 200) {
            return $this->sendPayload(null, "failed", $forecastResult['message'], $forecastResult['status']);
        }

        // Combine results
        $resultArray = [
            'current' => $weatherResult['data'],
            'forecast' => $forecastResult['data']
        ];

        return $this->sendPayload($resultArray, "success", "Request Success!", 200);
    }

    private function fetchApiData($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $result = curl_exec($ch);
        if ($result === false) {
            curl_close($ch);
            return ['status' => 500, 'message' => "Unable to fetch data."];
        }
        $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($http_status != 200) {
            return ['status' => $http_status, 'message' => "An error occurred while fetching data."];
        }
        $data = json_decode($result, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['status' => 500, 'message' => "Invalid JSON response."];
        }
        return ['status' => 200, 'data' => $data];
    }

    public function reverseGeocodeLocation($data)
    {
        if (!isset($data->lat) || !isset($data->lon)) {
            return $this->sendPayload(null, "failed", "Please enter a Location.", 400);
        }

        $lat = $data->lat;
        $lon = $data->lon;
        $api_key = $this->openWeatherKey;

        $api = "http://api.openweathermap.org/geo/1.0/reverse?lat=$lat&lon=$lon&appid=$api_key";

        $result = file_get_contents($api);

        if ($result === false) {
            return $this->sendPayload(null, "failed", "Unable to fetch weather data.", 500);
        }

        $resultArray = json_decode($result, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->sendPayload(null, "failed", "Invalid JSON response.", 500);
        }

        return $this->sendPayload($resultArray, "success", "Request Success!", 200);
    }

    public function reverseGeocodeCity($data)
    {
        if (!isset($data->city) || empty($data->city)) {
            return $this->sendPayload(null, "failed", "Please enter a City.", 400);
        }

        $city = $data->city;
        $api_key = $this->openWeatherKey;

        $api = "http://api.openweathermap.org/geo/1.0/direct?q=$city&appid=$api_key";

        $result = file_get_contents($api);

        if ($result === false) {
            return $this->sendPayload(null, "failed", "Unable to fetch weather data.", 500);
        }

        $resultArray = json_decode($result, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->sendPayload(null, "failed", "Invalid JSON response.", 500);
        }

        return $this->sendPayload($resultArray, "success", "Request Success!", 200);
    }

    public function getFiveDayForecast($data)
    {
        $validMetricSystems = ['&units=standard', '&units=metric', '&units=imperial'];
        if (!in_array($data->metricSystem, $validMetricSystems)) {
            return $this->sendPayload(null, "failed", "Invalid metric system.", 400);
        }
        if (!isset($data->lat) || !isset($data->lon)) {
            return $this->sendPayload(null, "failed", "Please enter a Location.", 400);
        }

        $lat = $data->lat;
        $lon = $data->lon;
        $metricSystem = $data->metricSystem;
        $api_key = $this->openWeatherKey;
        $api = "https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lon&appid=$api_key&$metricSystem";

        $result = file_get_contents($api);

        if ($result === false) {
            return $this->sendPayload(null, "failed", "Unable to fetch weather data.", 500);
        }

        $resultArray = json_decode($result, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->sendPayload(null, "failed", "Invalid JSON response.", 500);
        }

        return $this->sendPayload($resultArray, "success", "Request Success!", 200);
    }
}