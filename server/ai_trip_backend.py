from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, datetime, os, random
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")

def get_coordinates(city):
    """Get latitude and longitude using OpenStreetMap Nominatim"""
    try:
        url = f"https://nominatim.openstreetmap.org/search?city={city}&format=json"
        resp = requests.get(url, headers={"User-Agent": "TripPlannerApp"})
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print("❌ Nominatim error:", e)
    return None, None


@app.route("/api/ai/generate-trip", methods=["POST"])
def generate_trip():
    try:
        data = request.get_json()
        print("✅ Received:", data)

        destination = data.get("destination", "Unknown City")
        start_date = data.get("startDate", "")
        end_date = data.get("endDate", "")
        budget = float(data.get("budget", 1000))
        travelers = int(data.get("travelers", 1))
        interests = data.get("interests", ["sightseeing"])
        accommodation = data.get("accommodation", "mid-range")
        travel_style = data.get("travelStyle", "balanced")

        # Calculate trip duration
        if start_date and end_date:
            d1 = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            total_days = (d2 - d1).days + 1
        else:
            total_days = 3

        per_day = round(budget / total_days, 2)

        # Get coordinates
        lat, lon = get_coordinates(destination)
        if not lat or not lon:
            return jsonify({"status": "error", "message": "Could not find location coordinates."}), 400

        # Interest mapping
        interest_keywords = {
            "food": ["restaurant", "cafe", "street food"],
            "culture": ["museum", "temple", "church", "art gallery"],
            "sightseeing": ["landmark", "tourist attraction", "monument"],
            "relaxation": ["park", "beach", "spa"],
            "shopping": ["market", "mall"]
        }

        queries = []
        for i in interests:
            queries.extend(interest_keywords.get(i, ["tourist attraction"]))

        places = []
        for query in set(queries):
            try:
                url = f"https://api.foursquare.com/v3/places/nearby?ll={lat},{lon}&radius=10000&query={query}&limit=10"
                headers = {
                    "accept": "application/json",
                    "Authorization": FOURSQUARE_API_KEY
                }
                resp = requests.get(url, headers=headers)
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    for place in results:
                        name = place.get("name")
                        location = place.get("location", {})
                        address = location.get("formatted_address", "No address available")
                        category = place.get("categories", [{}])[0].get("name", query)
                        places.append({
                            "name": name,
                            "address": address,
                            "category": category
                        })
                else:
                    print(f"⚠️ API Error for {query}: {resp.text}")
            except Exception as e:
                print(f"❌ Error fetching {query}:", e)

        if not places:
            return jsonify({
                "status": "error",
                "message": f"No real places found for {destination}. Try again later."
            }), 404

        # Randomize itinerary
        random.shuffle(places)
        itinerary = []
        per_time = 3  # morning, afternoon, evening

        for day in range(1, total_days + 1):
            day_itinerary = {"day": day, "morning": [], "afternoon": [], "evening": []}
            day_places = places[(day - 1) * per_time: day * per_time * 3]

            for i, place in enumerate(day_places):
                slot = ["morning", "afternoon", "evening"][i % 3]
                cost = round(random.uniform(50, 150), 2)
                day_itinerary[slot].append({
                    "activity": f"Visit {place['name']} ({place['category']})",
                    "address": place['address'],
                    "cost": cost
                })

            itinerary.append(day_itinerary)

        suggestion = f"A {total_days}-day {travel_style} trip to {destination}, focusing on {', '.join(interests)}."

        return jsonify({
            "status": "success",
            "destination": destination,
            "totalDays": total_days,
            "perDay": per_day,
            "suggestion": suggestion,
            "itinerary": itinerary
        })

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8000)
