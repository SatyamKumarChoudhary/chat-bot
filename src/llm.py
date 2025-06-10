import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

region = os.getenv("AWS_REGION", "us-east-1")

bedrock_runtime = boto3.client("bedrock-runtime", region_name=region)

def invoke_claude(prompt: str) -> str:
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    response = bedrock_runtime.invoke_model(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(request_body)
    )

    response_body = json.loads(response['body'].read())
    content = response_body.get("content")

    if isinstance(content, list) and content:
        return content[0].get("text", "No text found in response.")
    elif isinstance(content, str):
        return content
    else:
        return "No text found in response."
