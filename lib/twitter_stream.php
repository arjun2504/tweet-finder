<?php
    class ctwitter_stream
    {
        private $m_oauth_consumer_key;
        private $m_oauth_consumer_secret;
        private $m_oauth_token;
        private $m_oauth_token_secret;

        private $m_oauth_nonce;
        private $m_oauth_signature;
        private $m_oauth_signature_method = 'HMAC-SHA1';
        private $m_oauth_timestamp;
        private $m_oauth_version = '1.0';

        public function __construct()
        {
            //
            // set a time limit to unlimited
            //
            set_time_limit(0);
        }

        //
        // set the login details
        //
        public function login($_consumer_key, $_consumer_secret, $_token, $_token_secret)
        {
            $this->m_oauth_consumer_key     = $_consumer_key;
            $this->m_oauth_consumer_secret  = $_consumer_secret;
            $this->m_oauth_token            = $_token;
            $this->m_oauth_token_secret     = $_token_secret;

            //
            // generate a nonce; we're just using a random md5() hash here.
            //
            $this->m_oauth_nonce = md5(mt_rand());

            return true;
        }

        //
        // process a tweet object from the stream
        //
        private function process_tweet(array $_data)
        {
            for($i = 0; $i<count($_data); $i++) {
                $pr_scr = $_data['user']['screen_name'].':'.$_data['text'].'<br/>';
                if($pr_scr == $new)
                    continue;

                $new = $pr_scr;
                echo $new;

            }
            //error_reporting(0);
            //print json_encode($_data);

            return true;
        }

        //
        // the main stream manager
        //
        public function start(array $_keywords)
        {
            while(1)
            {
                $fp = fsockopen("ssl://stream.twitter.com", 443, $errno, $errstr, 30);
                if (!$fp)
                {
                    echo "ERROR: Twitter Stream Error: failed to open socket";
                } else
                {
                    //
                    // build the data and store it so we can get a length
                    //
                    $data = 'track=' . rawurlencode(implode($_keywords, ','));

                    //
                    // store the current timestamp
                    //
                    $this->m_oauth_timestamp = time();

                    //
                    // generate the base string based on all the data
                    //
                    $base_string = 'POST&' . 
                        rawurlencode('https://stream.twitter.com/1.1/statuses/filter.json') . '&' .
                        rawurlencode('oauth_consumer_key=' . $this->m_oauth_consumer_key . '&' .
                            'oauth_nonce=' . $this->m_oauth_nonce . '&' .
                            'oauth_signature_method=' . $this->m_oauth_signature_method . '&' . 
                            'oauth_timestamp=' . $this->m_oauth_timestamp . '&' .
                            'oauth_token=' . $this->m_oauth_token . '&' .
                            'oauth_version=' . $this->m_oauth_version . '&' .
                            $data);

                    //
                    // generate the secret key to use to hash
                    //
                    $secret = rawurlencode($this->m_oauth_consumer_secret) . '&' . 
                        rawurlencode($this->m_oauth_token_secret);

                    //
                    // generate the signature using HMAC-SHA1
                    //
                    // hash_hmac() requires PHP >= 5.1.2 or PECL hash >= 1.1
                    //
                    $raw_hash = hash_hmac('sha1', $base_string, $secret, true);

                    //
                    // base64 then urlencode the raw hash
                    //
                    $this->m_oauth_signature = rawurlencode(base64_encode($raw_hash));

                    //
                    // build the OAuth Authorization header
                    //
                    $oauth = 'OAuth oauth_consumer_key="' . $this->m_oauth_consumer_key . '", ' .
                            'oauth_nonce="' . $this->m_oauth_nonce . '", ' .
                            'oauth_signature="' . $this->m_oauth_signature . '", ' .
                            'oauth_signature_method="' . $this->m_oauth_signature_method . '", ' .
                            'oauth_timestamp="' . $this->m_oauth_timestamp . '", ' .
                            'oauth_token="' . $this->m_oauth_token . '", ' .
                            'oauth_version="' . $this->m_oauth_version . '"';

                    //
                    // build the request
                    //
                    $request  = "POST /1.1/statuses/filter.json HTTP/1.1\r\n";
                    $request .= "Host: stream.twitter.com\r\n";
                    $request .= "Authorization: " . $oauth . "\r\n";
                    $request .= "Content-Length: " . strlen($data) . "\r\n";
                    $request .= "Content-Type: application/x-www-form-urlencoded\r\n\r\n";
                    $request .= $data."&language=en";

                    //
                    // write the request
                    //
                    fwrite($fp, $request);

                    //
                    // set it to non-blocking
                    //
                    stream_set_blocking($fp, 0);

                    while(!feof($fp))
                    {
                        $read   = array($fp);
                        $write  = null;
                        $except = null;

                        //
                        // select, waiting up to 10 minutes for a tweet; if we don't get one, then
                        // then reconnect, because it's possible something went wrong.
                        //
                        $res = stream_select($read, $write, $except, 600, 0);
                        if ( ($res == false) || ($res == 0) )
                        {
                            break;
                        }

                        //
                        // read the JSON object from the socket
                        //
                        $json = fgets($fp);

                        //
                        // look for a HTTP response code
                        //
                        if (strncmp($json, 'HTTP/1.1', 8) == 0)
                        {
                            $json = trim($json);
                            if ($json != 'HTTP/1.1 200 OK')
                            {
                                echo 'ERROR: ' . $json . "\n";
                                return false;
                            }
                        }

                        //
                        // if there is some data, then process it
                        //
                        if ( ($json !== false) && (strlen($json) > 0) )
                        {
                            //
                            // decode the socket to a PHP array
                            //
                            $data = json_decode($json, true);
                            if ($data)
                            {
                                //
                                // process it
                                //
                                $this->process_tweet($data);
                            }
                        }
                    }
                }

                fclose($fp);
                sleep(10);
            }

            return;
        }
    };
?>