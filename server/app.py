from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import math

app = Flask(__name__)
CORS(app)

# Overpass servers (backup if one fails)
OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter"
]

# Define categories for filtering
CATEGORY_FILTERS = {
    "restaurant": '["amenity"~"restaurant|cafe|fast_food"]',
    "hotel": '["tourism"~"hotel|hostel|guest_house"]',
    "medical": '["amenity"~"hospital|clinic|pharmacy|doctors"]',
    "atm": '["amenity"~"atm|bank"]',
    "fuel": '["amenity"~"fuel|charging_station"]'
}

@app.route("/")
def home():
    return jsonify({
        "message": "Nearby Places API is running!",
        "status": "success",
        "endpoints": {
            "/": "Homepage",
            "/api/health": "Health check",
            "/api/nearby": "Get nearby places (POST)"
        }
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running correctly!",
        "service": "Nearby Places API"
    })

@app.route("/api/nearby", methods=["POST", "GET"])
def nearby_places():
    try:
        if request.method == "POST":
            data = request.get_json() or {}
            lat = float(data.get("lat", 40.7128))
            lon = float(data.get("lon", -74.0060))
            radius = int(data.get("radius", 5000))
            category = data.get("category")
        else:
            # For GET requests, use default location
            lat, lon, radius = 40.7128, -74.0060, 5000
            category = None

        print(f"📍 Searching at {lat}, {lon}, radius: {radius}m")

        # Build Overpass query
        if category and category in CATEGORY_FILTERS:
            query = f"""
            [out:json][timeout:25];
            (
                node{CATEGORY_FILTERS[category]}(around:{radius},{lat},{lon});
                way{CATEGORY_FILTERS[category]}(around:{radius},{lat},{lon});
            );
            out center;
            """
        else:
            # Query all categories
            query = f"""
            [out:json][timeout:25];
            (
                node["amenity"](around:{radius},{lat},{lon});
                way["amenity"](around:{radius},{lat},{lon});
                node["tourism"](around:{radius},{lat},{lon});
                way["tourism"](around:{radius},{lat},{lon});
            );
            out center;
            """

        data = fetch_overpass(query)
        places = []
        
        for element in data.get("elements", []):
            place = parse_osm_element(element, lat, lon)
            if place:
                places.append(place)

        print(f"✅ Found {len(places)} places")

        return jsonify({
            "status": "success",
            "count": len(places),
            "places": places,
            "user_location": {"lat": lat, "lon": lon},
            "radius": radius
        })

    except Exception as e:
        print("Error fetching nearby places:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


def fetch_overpass(query):
    for server in OVERPASS_SERVERS:
        try:
            print(f"🔍 Trying Overpass server: {server}")
            res = requests.post(server, data=query, timeout=20)
            if res.status_code == 200:
                print(f"✅ Success with {server}")
                return res.json()
        except Exception as e:
            print(f"❌ Failed with {server}: {e}")
            continue
    return {"elements": []}


def parse_osm_element(element, user_lat, user_lon):
    try:
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            return None

        # Get coordinates
        if "lat" in element and "lon" in element:
            lat, lon = element["lat"], element["lon"]
        elif "center" in element:
            lat, lon = element["center"]["lat"], element["center"]["lon"]
        else:
            return None

        # Calculate distance
        distance = calculate_distance(user_lat, user_lon, lat, lon)

        # Determine category
        amenity = tags.get("amenity", "")
        tourism = tags.get("tourism", "")
        
        category = "other"
        if amenity in ["restaurant", "cafe", "fast_food"]:
            category = "restaurant"
        elif tourism in ["hotel", "hostel", "guest_house"]:
            category = "hotel"
        elif amenity in ["hospital", "clinic", "pharmacy", "doctors"]:
            category = "medical"
        elif amenity in ["atm", "bank"]:
            category = "atm"
        elif amenity in ["fuel", "charging_station"]:
            category = "fuel"

        # Build address
        address_parts = []
        if tags.get("addr:street"):
            address_parts.append(tags["addr:street"])
        if tags.get("addr:housenumber"):
            address_parts.append(tags["addr:housenumber"])
        address = ", ".join(address_parts) if address_parts else "Address not available"

        return {
            "id": element.get("id"),
            "name": name,
            "category": category,
            "lat": lat,
            "lon": lon,
            "address": address,
            "distance_km": round(distance, 2)
        }
    except Exception as e:
        print(f"Error parsing element: {e}")
        return None


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2) * math.sin(dlon/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


if __name__ == "__main__":
    print("🚀 Nearby Places API running on http://localhost:8000")
    print("📡 Available endpoints:")
    print("   GET  /                 - Homepage")
    print("   GET  /api/health       - Health check")
    print("   POST /api/nearby       - Get nearby places")
    print("   GET  /api/nearby       - Get nearby places (default location)")
    app.run(host="0.0.0.0", port=6000, debug=True)