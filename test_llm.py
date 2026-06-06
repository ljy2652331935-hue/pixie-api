"""Quick test to debug LLM call"""
import asyncio
import os
from openai import AsyncOpenAI

async def main():
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_API_BASE"),
    )
    
    try:
        response = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON only."},
                {"role": "user", "content": "Return exactly this JSON: {\"hello\": \"world\"}"},
            ],
            temperature=0.8,
            max_tokens=256,
        )
        print(f"finish_reason: {response.choices[0].finish_reason}")
        print(f"Content: {repr(response.choices[0].message.content)}")
        
        # Try with thinking model
        print("\n--- Trying claude-haiku-4-5 ---")
        response2 = await client.chat.completions.create(
            model="claude-haiku-4-5",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON only, no extra text."},
                {"role": "user", "content": "Return exactly this JSON: {\"hello\": \"world\"}"},
            ],
            temperature=0.8,
            max_tokens=256,
        )
        print(f"finish_reason: {response2.choices[0].finish_reason}")
        print(f"Content: {repr(response2.choices[0].message.content)}")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(main())
