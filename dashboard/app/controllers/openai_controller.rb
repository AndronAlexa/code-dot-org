class OpenaiController < ApplicationController
  SYSTEM_PROMPT = ''

  # POST /openai/chat_completion
  def chat_completion
    # Set up the API endpoint URL and request headers
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{CDO.openai_api_key}"
    }
    headers["OpenAI-Organization"] = CDO.openai_org if CDO.openai_org

    # Build the request body
    data = {
      # model: 'gpt-4',
      model: 'gpt-3.5-turbo',
      temperature: 0,
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: params[:prompt]}
      ],
    }

    puts "model: #{data[:model]}"
    puts "Request headers: #{headers}"

    # Send the request to the API endpoint
    response = HTTParty.post(url, headers: headers, body: data.to_json, timeout: 120)

    puts "Response status: #{response.code}"
    puts "Response body: #{response.body}"

    # Parse the response JSON and return the completed text
    response_body = JSON.parse(response.body)
    completed_text = response_body['choices'][0]['message']['content']

    puts "completion: #{completed_text}"

    render plain: completed_text
  end
end
