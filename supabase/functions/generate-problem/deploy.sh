#!/bin/bash

# Deploy the Edge Function
supabase functions deploy generate-problem --project-ref tpqwjxpuirwqysbemzfe
 
# Set the OpenAI API key (if not already set)
# supabase secrets set OPENAI_API_KEY=your-openai-api-key --project-ref tpqwjxpuirwqysbemzfe 