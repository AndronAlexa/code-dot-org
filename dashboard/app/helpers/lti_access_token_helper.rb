module LtiAccessTokenHelper
  NAMESPACE = "lti_v1_controller".freeze

  # client_id and issuer are present in the id_token we cache or store as a cookie from the LTI launch
  def get_access_token(client_id, issuer)
    cache_key = "#{NAMESPACE}/#{client_id}-#{issuer}"

    # check for valid access token
    access_token = CDO.shared_cache.read(cache_key)
    return access_token if access_token

    # get access_token_url for this LTI Integration
    integration = LtiIntegration.find_by(client_id: client_id, issuer: issuer)
    access_token_url = integration[:access_token_url]

    # assemble JWT payload
    jwt_payload = {
      iss: CDO.studio_url('', CDO.default_scheme),
      sub: client_id,
      aud: access_token_url,
      iat: Time.now.to_i,
      # this can be short, since the JWT will be validated as part of the access_token request handshake. Start at 5 minutes, reduce it if we feel like it.
      exp: (5).minutes.from_now.to_i,
      jti: SecureRandom.alphanumeric(10),
    }

    # get private key and kid TODO: figure out a more elegant way to tranform to hash from JSON, can it be a one liner?
    private_key_json = CDO.jwk_private_key_data
    private_key_hash = private_key_json.transform_keys(&:to_sym)
    private_key = private_key_hash[:private_key]
    kid = private_key_hash[:kid]

    # sign JWT
    pri = OpenSSL::PKey::RSA.new(private_key)
    jwt = JWT.encode(jwt_payload, pri, 'RS256', kid: kid)

    query = {
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt,
      scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem https://purl.imsglobal.org/spec/lti-ags/scope/result/read',
    }

    res = HTTParty.post(access_token_url, query: query, headers: {'Content-Type' => 'application/x-www-form-urlencoded'})
    # get access_token and exp from response
    access_token = res.body[:access_token]
    exp = res.body[:expires_in]

    # cache access_token, set expiration
    CDO.shared_cache.write(cache_key, access_token, expires_in: exp)

    return access_token
  end
end
