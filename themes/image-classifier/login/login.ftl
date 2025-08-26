<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Login - Image Classifier</title>
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css" />
  <link href="https://fonts.googleapis.com/css2?family=Quantico:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
  
  <div class="login-container">
    <h2>LOGIN</h2>

    <#if message?has_content>
      <div class="kc-feedback-text <#if message.type = 'error'>error<#elseif message.type = 'warning'>warning<#else>info</#if>">
        ${message.summary?no_esc}
      </div>
    </#if>
    
    <form id="kc-form-login" class="login-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
      
      <div class="form-group">
        <label for="username">Username</label>
        <input tabindex="1" id="username" name="username" type="text" autofocus autocomplete="off" placeholder="Enter username"/>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input tabindex="2" id="password" name="password" type="password" autocomplete="off" placeholder="Enter password"/>
      </div>
      
      <div class="form-actions">
        <button tabindex="3" type="submit" name="login" id="kc-login">Login</button>
      </div>
    </form>
  </div>
</body>
</html>
