var result = aa.bizDomain.getBizDomain("CONDITION TYPE");
if(result.getSuccess())
{
  var bizDomains = result.getOutput();
  for(var i =0 ; i < bizDomains.size(); i++)
  {
    var bizDomain = bizDomains.get(i);
    aa.print(bizDomain.getBizdomainValue());
  }
}