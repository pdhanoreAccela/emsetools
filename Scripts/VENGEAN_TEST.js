var file1 = new java.io.File("D:/hello.txt");
var file2 = new java.io.File("D:/HelloWorld.txt");
file1.createNewFile();
aa.print(file1.renameTo(file2));
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "vengean test invoked successfully");