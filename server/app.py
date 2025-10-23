from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Nearby Places API is running!',
        'endpoints': {
            'GET /': 'This homepage',
            'GET /api/health': 'Health check',
            'POST /api/nearby': 'Get nearby places',
            'GET /api/nearby/test': 'Test endpoint with sample data'
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'Nearby Places API',
        'message': 'Server is running correctly!'
    })

@app.route('/api/nearby/test', methods=['GET'])
def test_nearby():
    """Test endpoint that returns sample data"""
    sample_data = [
        {
            'id': 1,
            'name': 'Central Park Restaurant',
            'category': 'restaurant',
            'lat': 40.7829,
            'lon': -73.9654,
            'address': '123 Park Ave, New York',
            'amenity': 'restaurant',
            'distance': '0.5 km'
        },
        {
            'id': 2,
            'name': 'Grand Hotel',
            'category': 'hotel',
            'lat': 40.7589,
            'lon': -73.9851,
            'address': '456 Broadway, New York',
            'tourism': 'hotel',
            'distance': '1.2 km'
        },
        {
            'id': 3,
            'name': 'City Medical Center',
            'category': 'medical',
            'lat': 40.7414,
            'lon': -73.9903,
            'address': '789 Health St, New York',
            'amenity': 'hospital',
            'distance': '0.8 km'
        },
        {
            'id': 4,
            'name': 'Main Street Bank',
            'category': 'atm',
            'lat': 40.7505,
            'lon': -73.9934,
            'address': '321 Main St, New York',
            'amenity': 'bank',
            'distance': '1.5 km'
        },
        {
            'id': 5,
            'name': 'Downtown Fuel Station',
            'category': 'fuel',
            'lat': 40.7639,
            'lon': -73.9724,
            'address': '654 Fuel Ave, New York',
            'amenity': 'fuel',
            'distance': '2.1 km'
        }
    ]
    
    return jsonify({
        'status': 'success',
        'count': len(sample_data),
        'places': sample_data,
        'user_location': {'lat': 40.7128, 'lon': -74.0060},
        'note': 'This is test data from Flask API'
    })

@app.route('/api/nearby', methods=['POST', 'GET'])
def get_nearby_places():
    """Get nearby places based on user location"""
    try:
        if request.method == 'GET':
            # For GET requests, use default location
            lat = 40.7128
            lon = -74.0060
            radius = 5000
            category = None
        else:
            # For POST requests, get data from request body
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            lat = data.get('lat', 40.7128)
            lon = data.get('lon', -74.0060)
            category = data.get('category')
            radius = data.get('radius', 5000)
        
        print(f"🔍 Searching for nearby places at {lat}, {lon} (radius: {radius}m)")
        
        # Try to get real data from Overpass API
        real_data = query_overpass_api(lat, lon, radius, category)
        
        if real_data:
            places = []
            for element in real_data.get('elements', []):
                place_data = parse_osm_element(element)
                if place_data:
                    places.append(place_data)
            
            print(f"✅ Found {len(places)} real places from Overpass API")
            
            return jsonify({
                'status': 'success',
                'count': len(places),
                'places': places,
                'user_location': {'lat': lat, 'lon': lon},
                'source': 'overpass_api'
            })
        else:
            # Fallback to sample data if Overpass API fails
            print("⚠️ Using sample data as fallback")
            return test_nearby().get_json()
        
    except Exception as e:
        print(f"❌ Error in /api/nearby: {e}")
        # Return sample data as fallback
        return test_nearby().get_json()

def query_overpass_api(lat, lon, radius=5000, category=None):
    """Query Overpass API for nearby places"""
    try:
        # Define queries for different categories
        category_queries = {
            'restaurant': """
                [out:json];
                (
                    node["amenity"~"restaurant|cafe|fast_food"](around:{radius},{lat},{lon});
                    way["amenity"~"restaurant|cafe|fast_food"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            'medical': """
                [out:json];
                (
                    node["amenity"~"hospital|clinic|pharmacy|doctors"](around:{radius},{lat},{lon});
                    way["amenity"~"hospital|clinic|pharmacy|doctors"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            'atm': """
                [out:json];
                (
                    node["amenity"~"atm|bank"](around:{radius},{lat},{lon});
                    way["amenity"~"atm|bank"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            'fuel': """
                [out:json];
                (
                    node["amenity"~"fuel|charging_station"](around:{radius},{lat},{lon});
                    way["amenity"~"fuel|charging_station"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            'hotel': """
                [out:json];
                (
                    node["tourism"~"hotel|hostel|guest_house"](around:{radius},{lat},{lon});
                    way["tourism"~"hotel|hostel|guest_house"](around:{radius},{lat},{lon});
                );
                out center;
            """
        }
        
        if category and category in category_queries:
            query = category_queries[category]
        else:
            # Query all categories if no specific category provided
            query = """
                [out:json];
                (
                    node["amenity"~"restaurant|cafe|fast_food|hospital|clinic|pharmacy|atm|bank|fuel|charging_station"](around:{radius},{lat},{lon});
                    node["tourism"~"hotel|hostel|guest_house"](around:{radius},{lat},{lon});
                    way["amenity"~"restaurant|cafe|fast_food|hospital|clinic|pharmacy|atm|bank|fuel|charging_station"](around:{radius},{lat},{lon});
                    way["tourism"~"hotel|hostel|guest_house"](around:{radius},{lat},{lon});
                );
                out center;
            """
        
        query = query.format(radius=radius, lat=lat, lon=lon)
        
        url = "https://overpass-api.de/api/interpreter"
        response = requests.post(url, data=query, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Overpass API error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error querying Overpass API: {e}")
        return None

def parse_osm_element(element):
    """Parse OSM element and extract relevant data"""
    try:
        tags = element.get('tags', {})
        
        # Get name
        name = tags.get('name', 'Unknown Place')
        if name == 'Unknown Place':
            return None
        
        # Determine category
        category = 'other'
        amenity = tags.get('amenity', '')
        tourism = tags.get('tourism', '')
        
        if amenity in ['restaurant', 'cafe', 'fast_food']:
            category = 'restaurant'
        elif amenity in ['hospital', 'clinic', 'pharmacy', 'doctors']:
            category = 'medical'
        elif amenity in ['atm', 'bank']:
            category = 'atm'
        elif amenity in ['fuel', 'charging_station']:
            category = 'fuel'
        elif tourism in ['hotel', 'hostel', 'guest_house']:
            category = 'hotel'
        
        # Get coordinates
        lat, lon = None, None
        if 'lat' in element and 'lon' in element:
            lat, lon = element['lat'], element['lon']
        elif 'center' in element:
            lat, lon = element['center']['lat'], element['center']['lon']
        
        if not lat or not lon:
            return None
        
        # Build address
        address_parts = []
        if tags.get('addr:street'):
            address_parts.append(tags['addr:street'])
        if tags.get('addr:housenumber'):
            address_parts.append(tags['addr:housenumber'])
        if tags.get('addr:city'):
            address_parts.append(tags['addr:city'])
        
        address = ', '.join(address_parts) if address_parts else 'Address not available'
        
        return {
            'name': name,
            'category': category,
            'lat': lat,
            'lon': lon,
            'address': address,
            'amenity': amenity,
            'tourism': tourism
        }
        
    except Exception as e:
        print(f"Error parsing OSM element: {e}")
        return None

if __name__ == '__main__':
    print("🚀 Starting Nearby Places API on http://localhost:8000")
    print("📋 Available endpoints:")
    print("   GET  /                 - Homepage")
    print("   GET  /api/health       - Health check")
    print("   POST /api/nearby       - Get nearby places (with real data)")
    print("   GET  /api/nearby       - Get nearby places (with sample data)")
    print("   GET  /api/nearby/test  - Test endpoint with sample data")
    print("\n💡 Try these URLs in your browser:")
    print("   http://localhost:8000/")
    print("   http://localhost:8000/api/health")
    print("   http://localhost:8000/api/nearby/test")
    print("   http://localhost:8000/api/nearby")
    app.run(host='0.0.0.0', port=8000, debug=True)