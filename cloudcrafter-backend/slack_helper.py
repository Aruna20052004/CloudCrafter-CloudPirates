import requests

SLACK_WEBHOOK_URL = ""  # keep this secret

def send_slack_notification(app_id, status, url=None):
    text = f"CloudCrafter: *{app_id}* {status}"
    if url:
        text += f"\nLive URL: {url}"

    payload = {"text": text}
    try:
        resp = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=5)
        return {"ok": resp.ok, "status_code": resp.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}
