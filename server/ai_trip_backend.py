from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, datetime, os, random, time
from datetime import timedelta

app = Flask(__name__)
CORS(app)

def get_coordinates(city):
    """Get latitude and longitude using OpenStreetMap Nominatim"""
    try:
        url = f"https://nominatim.openstreetmap.org/search?city={city}&format=json&limit=1"
        resp = requests.get(url, headers={"User-Agent": "TripPlannerApp"})
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print("❌ Nominatim error:", e)
    return None, None

def get_places_from_overpass(lat, lon, interest, radius=20000):
    """Get places from Overpass API"""
    try:
        interest_queries = {
            "sightseeing": """
                [out:json];
                (
                    node["tourism"~"attraction|museum|viewpoint"](around:{radius},{lat},{lon});
                    node["historic"~"monument|castle|archaeological_site"](around:{radius},{lat},{lon});
                    node["amenity"~"place_of_worship"](around:{radius},{lat},{lon});
                    way["tourism"~"attraction|museum|viewpoint"](around:{radius},{lat},{lon});
                    way["historic"~"monument|castle|archaeological_site"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            "culture": """
                [out:json];
                (
                    node["tourism"~"museum|gallery"](around:{radius},{lat},{lon});
                    node["amenity"~"place_of_worship|theatre"](around:{radius},{lat},{lon});
                    node["historic"~"monument|memorial"](around:{radius},{lat},{lon});
                    way["tourism"~"museum|gallery"](around:{radius},{lat},{lon});
                    way["amenity"~"place_of_worship|theatre"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            "food": """
                [out:json];
                (
                    node["amenity"~"restaurant|cafe|fast_food"](around:{radius},{lat},{lon});
                    node["shop"~"bakery"](around:{radius},{lat},{lon});
                    way["amenity"~"restaurant|cafe|fast_food"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            "shopping": """
                [out:json];
                (
                    node["shop"](around:{radius},{lat},{lon});
                    node["amenity"~"marketplace"](around:{radius},{lat},{lon});
                    way["shop"](around:{radius},{lat},{lon});
                );
                out center;
            """,
            "relaxation": """
                [out:json];
                (
                    node["leisure"~"park|garden"](around:{radius},{lat},{lon});
                    node["tourism"~"zoo|aquarium"](around:{radius},{lat},{lon});
                    node["natural"~"beach"](around:{radius},{lat},{lon});
                    way["leisure"~"park|garden"](around:{radius},{lat},{lon});
                    way["natural"~"beach"](around:{radius},{lat},{lon});
                );
                out center;
            """
        }
        
        query_template = interest_queries.get(interest, interest_queries["sightseeing"])
        query = query_template.format(radius=radius, lat=lat, lon=lon)
        
        url = "https://overpass-api.de/api/interpreter"
        resp = requests.post(url, data=query, timeout=30)
        
        if resp.status_code == 200:
            data = resp.json()
            elements = data.get("elements", [])
            print(f"✅ Found {len(elements)} places from Overpass API for {interest}")
            return elements
        else:
            print(f"❌ Overpass API Error: {resp.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error fetching from Overpass API:", e)
        return []

def enhance_osm_place_data(place):
    """Extract and enhance place data from OSM response"""
    try:
        tags = place.get("tags", {})
        name = tags.get("name", "Unknown Place")
        
        if name == "Unknown Place":
            return None
            
        # Get category from tags
        category = "Point of Interest"
        if "tourism" in tags:
            category = tags["tourism"].replace("_", " ").title()
        elif "amenity" in tags:
            category = tags["amenity"].replace("_", " ").title()
        elif "shop" in tags:
            category = tags["shop"].replace("_", " ").title()
        elif "historic" in tags:
            category = tags["historic"].replace("_", " ").title()
        elif "leisure" in tags:
            category = tags["leisure"].replace("_", " ").title()
        elif "natural" in tags:
            category = tags["natural"].replace("_", " ").title()
        
        # Build address
        address_parts = []
        if tags.get("addr:street"):
            address_parts.append(tags["addr:street"])
        if tags.get("addr:city"):
            address_parts.append(tags["addr:city"])
        if tags.get("addr:state"):
            address_parts.append(tags["addr:state"])
        
        address = ", ".join(address_parts) if address_parts else "Location details available on map"
        
        # Get coordinates - handle both nodes and ways
        lat, lon = None, None
        if "lat" in place and "lon" in place:
            lat, lon = place["lat"], place["lon"]
        elif "center" in place:
            lat, lon = place["center"]["lat"], place["center"]["lon"]
        
        if not lat or not lon:
            return None
            
        return {
            "name": name,
            "address": address,
            "category": category,
            "lat": lat,
            "lon": lon,
            "tags": tags
        }
    except Exception as e:
        print(f"❌ Error enhancing OSM place data: {e}")
        return None

def create_time_slots(start_time, visit_duration, travel_time):
    """Create time slots with specific timings"""
    end_time = start_time + timedelta(minutes=visit_duration)
    next_start_time = end_time + timedelta(minutes=travel_time)
    
    return {
        "start_time": start_time.strftime("%H:%M"),
        "end_time": end_time.strftime("%H:%M"),
        "duration_minutes": visit_duration,
        "travel_time_next": travel_time
    }

def estimate_visit_duration(category):
    """Estimate how long to spend at a place based on its category"""
    duration_map = {
        "Temple": 45,           # 45 minutes
        "Place Of Worship": 30, # 30 minutes
        "Museum": 120,          # 2 hours
        "Restaurant": 60,       # 1 hour
        "Cafe": 45,             # 45 minutes
        "Park": 90,             # 1.5 hours
        "Shopping Mall": 120,   # 2 hours
        "Market": 90,           # 1.5 hours
        "Palace": 90,           # 1.5 hours
        "Viewpoint": 30,        # 30 minutes
        "Gallery": 90,          # 1.5 hours
        "Beach": 120,           # 2 hours
        "Zoo": 180,             # 3 hours
        "Monument": 30,         # 30 minutes
        "Castle": 120,          # 2 hours
        "Archaeological Site": 90, # 1.5 hours
    }
    return duration_map.get(category, 60)  # Default 1 hour

@app.route("/api/ai/generate-trip", methods=["POST"])
def generate_trip():
    try:
        data = request.get_json()
        print("✅ Received:", data)

        destination = data.get("destination", "").strip()
        start_date = data.get("startDate", "")
        end_date = data.get("endDate", "")
        budget = float(data.get("budget", 1000))
        travelers = int(data.get("travelers", 1))
        interests = data.get("interests", ["sightseeing"])
        accommodation = data.get("accommodation", "mid-range")
        travel_style = data.get("travelStyle", "balanced")

        if not destination:
            return jsonify({"status": "error", "message": "Destination is required"}), 400

        # Calculate trip duration
        if start_date and end_date:
            d1 = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            total_days = (d2 - d1).days + 1
        else:
            total_days = 3

        per_day = round(budget / total_days, 2)

        # Get coordinates
        print(f"📍 Getting coordinates for {destination}...")
        lat, lon = get_coordinates(destination)
        if not lat or not lon:
            return jsonify({"status": "error", "message": f"Could not find coordinates for {destination}."}), 400

        print(f"📍 Coordinates found: {lat}, {lon}")

        # Get places from Overpass API - MORE PLACES
        all_places = []
        for interest in interests:
            print(f"🔍 Searching for {interest} places in {destination}...")
            places = get_places_from_overpass(lat, lon, interest, radius=25000)
            
            for place in places:
                enhanced_place = enhance_osm_place_data(place)
                if enhanced_place:
                    all_places.append(enhanced_place)
            
            time.sleep(1)  # Be nice to the API

        print(f"📊 Total raw places found: {len(all_places)}")

        # Remove duplicates by name and coordinates
        unique_places = []
        seen_combinations = set()
        
        for place in all_places:
            place_key = f"{place['name']}_{place['lat']:.4f}_{place['lon']:.4f}"
            if place_key not in seen_combinations:
                seen_combinations.add(place_key)
                unique_places.append(place)

        print(f"🎯 Unique places after deduplication: {len(unique_places)}")

        if not unique_places:
            return jsonify({
                "status": "error", 
                "message": f"No places found for {destination}. Try a larger city or different interests."
            }), 404

        # Sort by category diversity and importance
        unique_places.sort(key=lambda x: (
            0 if "tourism" in str(x.get('tags', {})) else 1,  # Prioritize tourist spots
            len(x['name'])  # Shorter names often indicate more important places
        ))

        # Generate itinerary with ALL places
        itinerary = []
        activities_per_day = min(8, len(unique_places) // total_days + 2)  # More activities per day
        
        for day in range(1, total_days + 1):
            # Get places for this day
            start_idx = (day - 1) * activities_per_day
            end_idx = start_idx + activities_per_day
            day_places = unique_places[start_idx:end_idx]
            
            if not day_places:
                continue
                
            day_itinerary = {
                "day": day,
                "date": (datetime.datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=day-1)).strftime("%Y-%m-%d") if start_date else f"Day {day}",
                "schedule": []
            }
            
            # Start day at 9:00 AM
            current_time = datetime.datetime.strptime("09:00", "%H:%M")
            
            for i, place in enumerate(day_places):
                # Estimate visit duration
                visit_duration = estimate_visit_duration(place["category"])
                
                # Calculate travel time to next place (if any)
                travel_time = 0
                if i < len(day_places) - 1:
                    travel_time = 15  # Default 15 minutes
                
                # Create time slot
                time_slot = create_time_slots(current_time, visit_duration, travel_time)
                
                # Add to itinerary - NO COSTS
                day_itinerary["schedule"].append({
                    "activity": f"Visit {place['name']}",
                    "description": place['category'],
                    "address": place['address'],
                    "category": place['category'],
                    "time_slot": time_slot,
                    "lat": place['lat'],
                    "lon": place['lon'],
                    "travel_info": f"Travel to next: {travel_time} min" if travel_time > 0 else "Last activity"
                })
                
                # Move time forward (visit duration + travel time)
                current_time = current_time + timedelta(minutes=visit_duration + travel_time)
                
                # Add lunch break after 2-3 activities
                if i == 2 and current_time.hour < 14:
                    lunch_duration = 60
                    lunch_time = create_time_slots(current_time, lunch_duration, 0)
                    day_itinerary["schedule"].append({
                        "activity": "Lunch Break",
                        "description": "Meal time",
                        "address": "Local restaurant",
                        "category": "Food",
                        "time_slot": lunch_time,
                        "lat": None,
                        "lon": None,
                        "travel_info": "Break time"
                    })
                    current_time = current_time + timedelta(minutes=lunch_duration)

            itinerary.append(day_itinerary)

        suggestion = f"A {total_days}-day {travel_style} trip to {destination} with {len(unique_places)} unique places focusing on {', '.join(interests)}."

        return jsonify({
            "status": "success",
            "destination": destination,
            "totalDays": total_days,
            "perDay": per_day,
            "totalPlacesFound": len(unique_places),
            "suggestion": suggestion,
            "itinerary": itinerary,
            "allPlaces": unique_places  # Send ALL places for the map
        })

    except Exception as e:
        print("❌ Server Error:", str(e))
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "Trip Planner API"})

if __name__ == "__main__":
    app.run(debug=True, port=8000)