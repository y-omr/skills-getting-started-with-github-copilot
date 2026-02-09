import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


INITIAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))


@pytest.fixture()
def client():
    return TestClient(app)


def test_root_redirects_to_static(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code in {301, 307}
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_activity_map(client):
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()

    assert "Basketball Team" in data
    assert data["Basketball Team"]["max_participants"] == 15


def test_signup_for_activity_success(client):
    response = client.post(
        "/activities/Art Club/signup",
        params={"email": "taylor@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Signed up taylor@mergington.edu for Art Club"
    assert "taylor@mergington.edu" in activities["Art Club"]["participants"]


def test_signup_rejects_duplicate_email(client):
    response = client.post(
        "/activities/Art Club/signup",
        params={"email": "emma@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for an activity"


def test_signup_missing_activity(client):
    response = client.post(
        "/activities/Science Club/signup",
        params={"email": "sydney@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_success(client):
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "michael@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Unregistered michael@mergington.edu from Chess Club"
    assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]


def test_unregister_missing_student(client):
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "unknown@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student not found in this activity"
