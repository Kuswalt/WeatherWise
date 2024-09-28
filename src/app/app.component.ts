import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { WeatherService } from './services/weather.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';

interface Weather {
  description: string;
  icon: string;
}

interface Forecast {
  dt_txt: string;
  weather: Weather[];
  main: { temp: number };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
     ReactiveFormsModule, 
     CommonModule,
      MatTooltipModule, 
      MatMenuModule, 
      MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'weatherwise';
  searchForm: any;
  private subscriptions = new Subscription();
  weatherData: any;
  forecastData: { list: Forecast[] } = { list: [] };
  fiveHourForecastData: { list: Forecast[] } = { list: [] };
  loading: boolean = false;
  metricSystem: any = '&units=metric'; // My default metric system.
  userLocation: any;
  showAdvanced: boolean = false;
  timeFormat: '24-hour' | '12-hour' = '24-hour'; // Default time format
  currentDateTime: Date = new Date(); // Add this line

  constructor(
    private http: HttpClient,
    private builder: FormBuilder,
    private weather: WeatherService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = builder.group({
      city: ['', Validators.required],
      metricSystem: [this.metricSystem]
    });

    if (isPlatformBrowser(this.platformId)) {
      const metricSystem: any = localStorage.getItem('metricSystem');
      if (metricSystem && metricSystem !== 'null') {
        this.metricSystem = metricSystem;
      }

      const showAdvancedString: any = localStorage.getItem('showAdvanced');
      if (showAdvancedString) {
        this.showAdvanced = JSON.parse(showAdvancedString);
      }

      const timeFormat: any = localStorage.getItem('timeFormat');
      if (timeFormat && timeFormat !== 'null') {
        this.timeFormat = timeFormat;
      }

      setInterval(() => {
        this.currentDateTime = new Date(); // Update the current date and time every second
      }, 1000);
    }
  }

  getUserLocation() {
    if (isPlatformBrowser(this.platformId) && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log(userLocation);
          this.searchByLocation(userLocation.lat, userLocation.lon);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Handle the error, maybe set a default location or show an error message
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Handle the case when geolocation is not available
      console.log('Geolocation is not available');
      // Maybe set a default location or show an error message
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.getUserLocation();
    }
  }

  searchByLocation(lat: any = null, lon: any = null) {
    this.loading = true;
    let userLocation;
    userLocation = {
      lat: lat,
      lon: lon,
      metricSystem: this.metricSystem
    };
    this.subscriptions.add(
      this.weather.searchByLocation(userLocation).subscribe(
        (res: any) => {
          this.weatherData = res.payload.current;
          this.forecastData = { list: this.filterFiveDayForecast(res.payload.forecast.list) };
          this.fiveHourForecastData = { list: this.filterFutureHours(res.payload.forecast.list) }; // Filter future hours
          console.log(this.weatherData);
          console.log(this.forecastData);
          console.log(this.fiveHourForecastData);
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching weather:', error);
          this.loading = false;
        }
      )
    );
  }

  searchByCity() {
    this.searchForm.patchValue({
      metricSystem: this.metricSystem
    });
    if (!this.searchForm.valid) {
      Swal.fire({
        title: "Please Enter a City",
        icon: "warning"
      });
      return;
    }
    this.subscriptions.add(
      this.weather.searchByCity(this.searchForm.value).subscribe((res: any) => {
        this.weatherData = res.payload.current;
        this.forecastData = { list: this.filterFiveDayForecast(res.payload.forecast.list) };
        this.fiveHourForecastData = { list: this.filterFutureHours(res.payload.forecast.list) }; // Filter future hours
        console.log("City:");
        console.log(this.weatherData);
        console.log(this.forecastData);
        console.log(this.fiveHourForecastData);
        this.searchForm.reset(); // Clear the form after search
      }, error => {
        if (error.error && error.error.status) {
          switch (error.status) {
            case 404:
              Swal.fire({
                title: "City not found",
                text: `${error.error.status.message}`,
                icon: "warning",
                timer: 2000,
                timerProgressBar: true,
              });
              break;
            case 400:
              Swal.fire({
                title: "Invalid City",
                text: `Please enter a valid city.`,
                icon: "warning",
                timer: 2000,
                timerProgressBar: true,
              });
              break;
            default:
              Swal.fire({
                title: "Error fetching data",
                text: `${error.error.status.message}`,
                icon: "error",
                timer: 2000,
                timerProgressBar: true,
              });
          }
        } else {
          Swal.fire({
            title: "City not found.",
            text: `Please Enter a Valid City.`,
            icon: "warning",
            timer: 2000,
            timerProgressBar: true,
          });
        }
      })
    );
  }

  filterFiveDayForecast(forecastList: Forecast[]): Forecast[] {
    const today = new Date();
    const fiveDaysAhead = new Date();
    fiveDaysAhead.setDate(today.getDate() + 5);
  
    const dailyForecasts: { [key: string]: Forecast } = {};
  
    forecastList.forEach(forecast => {
      const forecastDate = new Date(forecast.dt_txt);
      const dateKey = forecastDate.toISOString().split('T')[0]; // Get the date part only
  
      if (forecastDate > today && forecastDate < fiveDaysAhead) { // Exclude the current date
        // If there's no entry for this date or the current forecast is closer to noon, update the entry
        if (!dailyForecasts[dateKey] || Math.abs(forecastDate.getHours() - 12) < Math.abs(new Date(dailyForecasts[dateKey].dt_txt).getHours() - 12)) {
          dailyForecasts[dateKey] = forecast;
        }
      }
    });
  
    return Object.values(dailyForecasts);
  }

  filterFutureHours(forecastList: Forecast[]): Forecast[] {
    const now = new Date();
  
    return forecastList.filter(forecast => {
      const forecastDate = new Date(forecast.dt_txt);
      return forecastDate > now; // Only include future hours
    }).slice(0, 5); // Limit to the next 5 entries
  }

  changeMetricSystem(metricSystem: string) {
    this.metricSystem = metricSystem;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('metricSystem', metricSystem);
    }

    if (this.weatherData) {
      // If weather data is already available, use the current city name to fetch new data
      const currentCity = this.weatherData.name; // Assuming weatherData has a name property with the city name
      this.searchForm.patchValue({ city: currentCity });
      this.searchByCity();
    } else if (this.searchForm.value.city) {
      // If no weather data but city is specified, search by city
      this.searchByCity();
    } else {
      // If no weather data and no city, fallback to user location
      this.getUserLocation();
    }
  }

  getMetricSymbol(metric: string): string {
    switch(metric){
      case '&units=metric':
        return '°C'
      case '&units=imperial':
        return '°F'
      case '&units=standard':
        return 'K'
      default:
        return ''
    }
  }


  changeTimeFormat(format: '24-hour' | '12-hour') {
    this.timeFormat = format;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('timeFormat', format);
    }
  }
    
  getWindDirection(deg: number): string {
    switch (true) {
        case (deg >= 0 && deg < 22.5):
            return 'N';
        case (deg >= 22.5 && deg < 67.5):
            return 'NE';
        case (deg >= 67.5 && deg < 112.5):
            return 'E';
        case (deg >= 112.5 && deg < 157.5):
            return 'SE';
        case (deg >= 157.5 && deg < 202.5):
            return 'S';
        case (deg >= 202.5 && deg < 247.5):
            return 'SW';
        case (deg >= 247.5 && deg < 292.5):
            return 'W';
        case (deg >= 292.5 && deg < 337.5):
            return 'NW';
        default:
            return 'N';
    }
  }

  setAsLocation(lat: number, lon: number) {
    const userLocation = {lat: lat, lon: lon};
    this.userLocation = userLocation;
    if (isPlatformBrowser(this.platformId)) {
      const userLocationToString = JSON.stringify(userLocation);
      localStorage.setItem('userLocation', userLocationToString);
    }
  }

  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
    if (isPlatformBrowser(this.platformId)) {
      const showAdvancedToString = JSON.stringify(this.showAdvanced);
      localStorage.setItem('showAdvanced', showAdvancedToString);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)){
    this.subscriptions.unsubscribe();
    }
  }
}