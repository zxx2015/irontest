<#include "httpResponseHeaders.ftl">

<div class="row">
  <div class="col-lg-12">
    <textarea class="form-control" rows="8" readonly>
      <#t>${ (stepRun.response.httpBody??)?then(stepRun.response.httpBody, '') }
    </textarea>
  </div>
</div>

