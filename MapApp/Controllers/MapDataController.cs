using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace MapApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MapDataController : Controller
    {
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] IEnumerable<JObject> mapToSave)
        {

            System.IO.File.WriteAllText(@".\maps.json", JsonConvert.SerializeObject(mapToSave));

            // serialize JSON directly to a file
            using (StreamWriter file = System.IO.File.CreateText(@".\maps.json"))
            {
                JsonSerializer serializer = new JsonSerializer();
                serializer.Serialize(file, mapToSave);
            }
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using (StreamReader file = System.IO.File.OpenText(@".\maps.json"))
            {
                JsonSerializer serializer = new JsonSerializer();
                var maps = (IEnumerable<JObject>)serializer.Deserialize(file, typeof(IEnumerable<JObject>));
                return Ok(maps);
            }
        }
    }
}