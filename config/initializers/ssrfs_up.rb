SSRFsUp.configure do |config|
  # turning on "fast path" for all usage of ssrfs-up
  # this means, it will no longer go through a proxy, but
  # use a local check to test for SSRF
  config.proxy = false
end
